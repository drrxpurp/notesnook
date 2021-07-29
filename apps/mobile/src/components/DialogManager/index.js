import React, { Component, createRef } from 'react';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  openVault
} from '../../services/EventManager';
import { getCurrentColors } from '../../utils/Colors';
import {
  eCloseActionSheet,
  eCloseAddNotebookDialog,
  eCloseLoginDialog, eClosePremiumDialog, eOnLoadNote,
  eOpenActionSheet,
  eOpenAddNotebookDialog,
  eOpenExportDialog,
  eOpenLoginDialog, eOpenPremiumDialog, eShowGetPremium,
  eThemeUpdated
} from '../../utils/Events';
import { EditorSettings } from '../../views/Editor/EditorSettings';
import { ActionSheetComponent } from '../ActionSheetComponent';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import { AddNotebookDialog } from '../AddNotebookDialog';
import { AddTopicDialog } from '../AddTopicDialog';
import { Dialog } from '../Dialog';
import ExportDialog from '../ExportDialog';
import ImagePreview from '../ImagePreview';
import LoginDialog from '../LoginDialog';
import MergeEditor from '../MergeEditor';
import MoveNoteDialog from '../MoveNoteDialog';
import PendingDialog from '../Premium/PendingDialog';
import PremiumDialog from '../Premium/PremiumDialog';
import PremiumStatusDialog from '../Premium/PremiumStatusDialog';
import ProgressDialog from '../ProgressDialog';
import PublishNoteDialog from '../PublishNoteDialog';
import RateDialog from '../RateDialog';
import RecoveryKeyDialog from '../RecoveryKeyDialog';
import RestoreDialog from '../RestoreDialog';
import ResultDialog from '../ResultDialog';
import SortDialog from '../SortDialog';
import TagsDialog from '../TagsDialog';
import { UpdateDialog } from '../UpdateDialog';
import { VaultDialog } from '../VaultDialog';

export class DialogManager extends Component {
  constructor(props) {
    super(props);
    this.actionSheet = createRef();
    this.opened = false;
    this.state = {
      item: {},
      actionSheetVisible: false,
      colors: getCurrentColors(),
      actionSheetData: {
        colors: false,
        tags: false,
        rowItems: [],
        columnItems: [],
      },
      simpleDialog: {
        title: '',
        paragraph: '',
        positiveText: '',
        negativeText: '',
        action: 0,
        icon: '',
      },
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
      nextState !== this.state
    );
  }

  _showActionSheet = data => {
    this.setState(
      {
        actionSheetData: data,
        item: data.item ? data.item : {},
        actionSheetVisible: true,
      },
      () => {
        this.actionSheet.current?.setModalVisible();
      },
    );
  };

  _hideActionSheet = () => {
    this.actionSheet.current?.setModalVisible(false);
  };

  loadNote = i => {
    if (i && i.type === 'new') {
      this.setState({
        item: {},
      });
    } else {
      this.setState({
        item: i,
      });
    }
  };

  showAddTopic = () => {
    let item = this.state.item;
    this.addTopicsDialog.open({
      notebookId: item?.type !== 'topic' ? item.id : item.notebookId,
      toEdit: item?.type === 'topic' ? item : null,
    });
  };

  hideAddTopic = () => {
    this.addTopicsDialog.close();
  };

  onThemeChange = () => {
    this.setState({
      colors: getCurrentColors(),
    });
  };

  componentDidMount() {
    eSubscribeEvent(eThemeUpdated, this.onThemeChange);
    eSubscribeEvent(eOnLoadNote, this.loadNote);

    eSubscribeEvent(eOpenActionSheet, this._showActionSheet);
    eSubscribeEvent(eCloseActionSheet, this._hideActionSheet);

    eSubscribeEvent(eOpenAddNotebookDialog, this.showAddNotebook);
    eSubscribeEvent(eCloseAddNotebookDialog, this.hideAddNotebook);

    eSubscribeEvent(eOpenPremiumDialog, this.showPremiumDialog);
    eSubscribeEvent(eClosePremiumDialog, this.hidePremiumDialog);
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eThemeUpdated, this.onThemeChange);
    eUnSubscribeEvent(eOnLoadNote, this.loadNote);

    eUnSubscribeEvent(eOpenActionSheet, this._showActionSheet);
    eUnSubscribeEvent(eCloseActionSheet, this._hideActionSheet);

    eUnSubscribeEvent(eOpenAddNotebookDialog, this.showAddNotebook);
    eUnSubscribeEvent(eCloseAddNotebookDialog, this.hideAddNotebook);

    eUnSubscribeEvent(eOpenLoginDialog, this.showLoginDialog);
    eUnSubscribeEvent(eCloseLoginDialog, this.hideLoginDialog);

    eUnSubscribeEvent(eOpenPremiumDialog, this.showPremiumDialog);
    eUnSubscribeEvent(eClosePremiumDialog, this.hidePremiumDialog);
  }

  showPremiumDialog = prompoInfo => {
    this.premiumDialog.open(prompoInfo);
  };

  hidePremiumDialog = () => {
    this.premiumDialog.close();
  };

  showAddNotebook = data => {
    this.setState(
      {
        item: data.item ? data.item : data.type === 'notebook' ? data : {},
      },
      () => {
        this.addNotebooksDialog.open();
      },
    );
  };
  hideAddNotebook = () => {
    this.addNotebooksDialog.close();
  };

  onActionSheetHide = () => {
    if (this.show) {
      switch (this.show) {
        case 'novault': {
          openVault({
            item: this.state.item,
            novault: false,
            title: 'Create vault',
            description: 'Set a password to create a vault and lock note.',
          });
          break;
        }
        case 'locked': {
          openVault({
            item: this.state.item,
            novault: true,
            locked: true,
            title: 'Lock note',
            description: 'Give access to vault to lock this note.',
          });
          break;
        }
        case 'unlock': {
          openVault({
            item: this.state.item,
            novault: true,
            locked: true,
            permanant: true,
            title: 'Unlock note',
            description: 'Remove note from the vault.',
          });
          break;
        }
        case 'notebook': {
          this.showAddNotebook({item: this.state.item});
          break;
        }
        case 'topic': {
          this.showAddTopic();
          break;
        }
        case 'premium': {
          eSendEvent(eOpenPremiumDialog);
          break;
        }
        case 'export': {
          eSendEvent(eOpenExportDialog, [this.state.item]);
          break;
        }
      }
    }
    this.show = null;
  };

  render() {
    let {actionSheetData, item, simpleDialog, colors} = this.state;
    return (
      <>
        {!this.state.actionSheetVisible ? null : (
          <ActionSheetWrapper
            fwdRef={this.actionSheet}
            onClose={() => {
              eSendEvent(eShowGetPremium, null);
              this.onActionSheetHide();
              this.setState({
                actionSheetVisible: false,
              });
            }}>
            <ActionSheetComponent
              item={item}
              setWillRefresh={value => {
                this.willRefresh = true;
              }}
              getRef={() => this.actionSheet}
              hasColors={actionSheetData.colors}
              hasTags={actionSheetData.colors}
              overlayColor={
                colors.night ? 'rgba(225,225,225,0.1)' : 'rgba(0,0,0,0.3)'
              }
              rowItems={actionSheetData.rowItems}
              columnItems={actionSheetData.columnItems}
              close={value => {
                if (value) {
                  this.show = value;
                }
                this.actionSheet.current?.setModalVisible();
              }}
            />
          </ActionSheetWrapper>
        )}

        <Dialog context="global" />
        <AddTopicDialog
          ref={ref => (this.addTopicsDialog = ref)}
          close={() => {
            this.setState({
              item: {},
            });
          }}
          colors={colors}
        />
        <AddNotebookDialog
          ref={ref => (this.addNotebooksDialog = ref)}
          toEdit={item}
          colors={colors}
        />
        <PremiumDialog
          ref={ref => (this.premiumDialog = ref)}
          colors={colors}
        />
        <LoginDialog colors={colors} />
        <MergeEditor />
        <ExportDialog />
        <RecoveryKeyDialog colors={colors} />
        <PendingDialog colors={colors} />
        <PremiumStatusDialog />
        <ProgressDialog />
        <RestoreDialog />
        <ResultDialog />
        <VaultDialog colors={colors} />
        <MoveNoteDialog colors={colors} />

        <UpdateDialog />
        <RateDialog />
        <ImagePreview />
        <EditorSettings />
        <PublishNoteDialog />
        <TagsDialog/>
      </>
    );
  }
}
