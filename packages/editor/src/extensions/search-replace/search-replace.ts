/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Editor, Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import {
  EditorState,
  Plugin,
  PluginKey,
  TextSelection,
  Transaction
} from "prosemirror-state";
import { Node } from "prosemirror-model";

type DispatchFn = (tr: Transaction) => void;
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchreplace: {
      startSearch: () => ReturnType;
      endSearch: () => ReturnType;
      search: (term: string, options?: SearchSettings) => ReturnType;
      moveToResult: (index: number) => ReturnType;
      moveToNextResult: () => ReturnType;
      moveToPreviousResult: () => ReturnType;
      replace: (term: string) => ReturnType;
      replaceAll: (term: string) => ReturnType;
    };
  }
}

export interface SearchResult {
  from: number;
  to: number;
  preview: {
    text: string;
    match: { from: number; to: number };
  };
}

interface SearchOptions {
  searchResultClass: string;
}

interface SearchSettings {
  matchCase: boolean;
  enableRegex: boolean;
  matchWholeWord: boolean;
}

export type SearchStorage = SearchSettings & {
  searchTerm: string;
  selectedIndex: number;
  isSearching: boolean;
  selectedText?: string;
  results?: SearchResult[];
};

interface TextNodeWithPosition {
  text: string;
  pos: number;
}

const updateView = (state: EditorState, dispatch: DispatchFn) => {
  if (!state.tr) return;

  state.tr.setMeta("forceUpdate", true);
  dispatch(state.tr);
};

const regex = (s: string, settings: SearchSettings): RegExp => {
  const { enableRegex, matchCase, matchWholeWord } = settings;
  const boundary = matchWholeWord ? "\\b" : "";
  console.log(boundary);
  return RegExp(
    boundary +
      (enableRegex ? s : s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")) +
      boundary,
    matchCase ? "gu" : "gui"
  );
};

function searchDocument(
  tr: Transaction,
  searchResultClass: string,
  searchTerm?: RegExp,
  selectedIndex?: number
): {
  decorationSet: DecorationSet;
  results: SearchResult[];
  startIndex: number;
} {
  if (!searchTerm)
    return {
      decorationSet: DecorationSet.empty,
      results: [],
      startIndex: selectedIndex || 0
    };

  const doc = tr.doc;
  const decorations: Decoration[] = [];
  const results = searchInNode(searchTerm, doc);

  // find the match we want to highlight in all the search results
  const { from: selectedFrom, to: selectedTo } = tr.selection;
  for (let i = 0; i < results.length; i++) {
    const { from, to } = results[i];
    if (
      // if a result is already selected, persist it
      (selectedFrom === from && to === selectedTo) ||
      // otherwise select the first matching result after the selection
      from >= selectedFrom
    ) {
      selectedIndex = i;
      break;
    }
  }

  // add decorations around all the matches
  for (let i = 0; i < results.length; i++) {
    const { from, to } = results[i];
    const isSelected = i === selectedIndex;
    const resultClass = isSelected
      ? `${searchResultClass} selected`
      : searchResultClass;
    decorations.push(Decoration.inline(from, to, { class: resultClass }));
  }

  return {
    startIndex: selectedIndex || 0,
    decorationSet: DecorationSet.create(doc, decorations),
    results
  };
}

function searchInNode(term: RegExp, node: Node) {
  const results: SearchResult[] = [];

  // search in all the extracted text nodes
  for (const { text, pos } of extractTextWithPosition(node)) {
    const matches = text.matchAll(term);

    for (const m of matches) {
      if (m[0] === "") break;

      if (m.index !== undefined) {
        results.push({
          from: pos + m.index,
          to: pos + m.index + m[0].length,
          preview: {
            text,
            match: {
              from: m.index,
              to: m.index + m[0].length
            }
          }
        });
      }
    }
  }

  return results;
}

function extractTextWithPosition(node: Node): TextNodeWithPosition[] {
  let currentNode: TextNodeWithPosition | null = null;
  const textNodesWithPosition: TextNodeWithPosition[] = [];
  node.descendants((node, pos) => {
    if (node.isText) {
      if (currentNode) {
        currentNode.text += node.text;
      } else {
        currentNode = {
          text: node.text || "",
          pos
        };
        textNodesWithPosition.push(currentNode);
      }
    } else {
      currentNode = null;
    }
  });
  return textNodesWithPosition;
}

const replaceAll = (
  replaceTerm: string,
  results: SearchResult[],
  tr: Transaction
) => {
  if (!results.length) return;

  const map = tr.mapping;
  for (let i = 0; i < results.length; i += 1) {
    const { from, to } = results[i];

    tr.insertText(replaceTerm, from, to);

    if (i + 1 < results.length) {
      const { from, to, preview } = results[i + 1];
      results[i + 1] = {
        from: map.map(from),
        to: map.map(to),
        preview
      };
    }
  }
  return tr;
};

export const SearchReplace = Extension.create<SearchOptions, SearchStorage>({
  name: "searchreplace",

  addOptions() {
    return {
      searchResultClass: "search-result"
    };
  },

  addCommands() {
    return {
      startSearch:
        () =>
        ({ state }) => {
          this.storage.isSearching = true;
          if (!state.selection.empty) {
            this.storage.selectedText = state.doc.textBetween(
              state.selection.$from.pos,
              state.selection.$to.pos
            );
          }
          return true;
        },
      endSearch:
        () =>
        ({ state, dispatch, editor }) => {
          this.storage.isSearching = false;
          this.storage.selectedText = undefined;
          this.storage.searchTerm = "";
          editor.commands.focus();
          if (dispatch) updateView(state, dispatch);
          return true;
        },
      search:
        (term, options?: SearchSettings) =>
        ({ state, dispatch }) => {
          this.storage.selectedIndex = 0;
          this.storage.searchTerm = term;
          this.storage.enableRegex = options?.enableRegex || false;
          this.storage.matchCase = options?.matchCase || false;
          this.storage.matchWholeWord = options?.matchWholeWord || false;
          this.storage.results = [];

          if (dispatch) updateView(state, dispatch);
          return true;
        },
      moveToResult:
        (index: number) =>
        ({ state, dispatch, commands }) => {
          const { results } = this.storage;
          if (!results || results.length <= 0) return false;

          const { from, to } = results[index];
          commands.setTextSelection({ from, to });
          scrollIntoView(this.editor, from);

          this.storage.selectedIndex = index;
          if (dispatch) updateView(state, dispatch);
          return true;
        },
      moveToNextResult:
        () =>
        ({ commands }) => {
          const { selectedIndex, results } = this.storage;
          if (!results || results.length <= 0) return false;

          let nextIndex = selectedIndex + 1;
          if (isNaN(nextIndex) || nextIndex >= results.length) nextIndex = 0;

          return commands.moveToResult(nextIndex);
        },
      moveToPreviousResult:
        () =>
        ({ commands }) => {
          const { selectedIndex, results } = this.storage;
          if (!results || results.length <= 0) return false;

          let prevIndex = selectedIndex - 1;
          if (isNaN(prevIndex) || prevIndex < 0) prevIndex = results.length - 1;

          return commands.moveToResult(prevIndex);
        },
      replace:
        (term) =>
        ({ commands, tr, dispatch }) => {
          const { selectedIndex, results } = this.storage;

          if (!dispatch || !results || results.length <= 0) return false;

          const index = selectedIndex === undefined ? 0 : selectedIndex;
          const { from, to } = results[index];

          tr.insertText(term, from, to);

          if (index + 1 < results.length) {
            const { from, to, preview } = results[index + 1];
            const nextResult = (results[index + 1] = {
              from: tr.mapping.map(from),
              to: tr.mapping.map(to),
              preview
            });

            commands.focus();
            tr.setSelection(
              new TextSelection(
                tr.doc.resolve(nextResult.from),
                tr.doc.resolve(nextResult.to)
              )
            );
          }
          dispatch(tr);
          results.splice(index, 1);
          return true;
        },
      replaceAll:
        (term) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;
          const { results } = this.storage;
          if (!dispatch || !results || results.length <= 0) return false;

          dispatch(replaceAll(term, results, tr));
          return true;
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-f": ({ editor }) => editor.commands.startSearch(),
      Escape: ({ editor }) => editor.commands.endSearch()
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("searchreplace");

    return [
      new Plugin({
        key,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, value) => {
            const { docChanged } = tr;
            const forceUpdate = tr.getMeta("forceUpdate");
            const {
              searchTerm,
              enableRegex,
              matchCase,
              matchWholeWord,
              selectedIndex,
              isSearching
            } = this.storage;
            if (docChanged || forceUpdate) {
              const { searchResultClass } = this.options;

              const searchRegex = searchTerm
                ? regex(searchTerm, { enableRegex, matchCase, matchWholeWord })
                : undefined;
              const result = searchDocument(
                tr,
                searchResultClass,
                searchRegex,
                selectedIndex
              );
              const { decorationSet, results, startIndex } = result;
              this.storage.results = results;
              this.storage.selectedIndex = startIndex;

              return decorationSet;
            }

            return isSearching ? value : DecorationSet.empty;
          }
        },
        props: {
          decorations(state) {
            return key.getState(state);
          }
        }
      })
    ];
  }
});

function scrollIntoView(editor: Editor, from: number) {
  setTimeout(() => {
    const domNode = document.querySelector(".search-result.selected");
    if (!(domNode instanceof HTMLElement)) return;

    domNode.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
}
