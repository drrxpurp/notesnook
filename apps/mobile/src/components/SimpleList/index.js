import React, {createRef, useState} from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import {useSafeArea} from 'react-native-safe-area-context';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eClearSearch, eScrollEvent} from '../../services/events';
import {db, ToastEvent} from '../../utils/utils';
import * as Animatable from 'react-native-animatable';
import {PinnedItemList} from './PinnedItemList';
const sectionListRef = createRef();

const AnimatedFlatlist = Animatable.createAnimatableComponent(FlatList);
const AnimatedSectionList = Animatable.createAnimatableComponent(SectionList);
const SimpleList = ({
  data,
  type,
  placeholder,
  RenderItem,
  focused,
  placeholderText,
  pinned = null,
  customRefresh,
  customRefreshing,
  isMove,
  hideMore,
  noteToMove,
  isHome = false,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;
  const searchResults = {...state.searchResults};
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeArea();
  const _onScroll = event => {
    if (!event) return;
    let y = event.nativeEvent.contentOffset.y;
    eSendEvent(eScrollEvent, y);
  };

  const _ListFooterComponent = data[0] ? (
    <View
      style={{
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: colors.navbg,
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
        }}>
        - End -
      </Text>
    </View>
  ) : null;

  const _renderSectionHeader = ({section: {title}}) => (
    <Text
      style={{
        fontFamily: WEIGHT.bold,
        fontSize: SIZE.xs + 1,
        color: colors.accent,
        paddingHorizontal: 12,
        width: '100%',
        alignSelf: 'center',
        marginTop: 15,
        paddingBottom: 5,
      }}>
      {title}
    </Text>
  );

  const _onRefresh = async () => {
    if (Platform.OS === 'ios') {
      dispatch({
        type: ACTIONS.SYNCING,
        syncing: true,
      });
    } else {
      setRefreshing(true);
    }
    try {
      let user = await db.user.get();
      dispatch({type: ACTIONS.USER, user: user});
      await db.sync();
      if (Platform.OS === 'ios') {
        dispatch({
          type: ACTIONS.SYNCING,
          syncing: false,
        });
      } else {
        setRefreshing(false);
      }
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      if (Platform.OS === 'ios') {
        dispatch({
          type: ACTIONS.SYNCING,
          syncing: false,
        });
      } else {
        setRefreshing(false);
      }
      ToastEvent.show(e.message, 'error');
    }
    dispatch({type: ACTIONS.ALL});
  };

  const _ListHeaderComponent_S =
    searchResults.type === type && searchResults.results.length > 0 ? (
      <View
        style={{
          marginTop:
            Platform.OS == 'ios'
              ? data[0] && !selectionMode
                ? 115
                : 115 - 60
              : data[0] && !selectionMode
              ? 155 - insets.top
              : 155 - insets.top - 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
        }}>
        <Text
          style={{
            fontFamily: WEIGHT.bold,
            color: colors.accent,
            fontSize: SIZE.xs,
          }}>
          Showing Results for {searchResults.keyword}
        </Text>
        <Text
          onPress={() => {
            eSendEvent(eClearSearch);
          }}
          style={{
            fontFamily: WEIGHT.regular,
            color: colors.errorText,
            fontSize: SIZE.xs,
          }}>
          Clear
        </Text>
      </View>
    ) : (
      <View
        style={{
          marginTop:
            Platform.OS == 'ios'
              ? data[0] && !selectionMode
                ? 135
                : 135 - 60
              : data[0] && !selectionMode
              ? 155 - insets.top
              : 155 - 60 - insets.top,
        }}>
          {
            pinned?   <PinnedItemList type={type} />: null
          }
      

      </View>
    );

  const _ListEmptyComponent = (
    <View
      style={{
        height: '80%',
        width: '100%',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        opacity: 1,
      }}>
      <>
        {placeholder}
        <Text
          style={{
            color: colors.icon,
            fontSize: SIZE.sm,
            fontFamily: WEIGHT.regular,
            marginTop: 35,
          }}>
          {placeholderText}
        </Text>
      </>
    </View>
  );

  const _listKeyExtractor = (item, index) =>
    item.id.toString() + index.toString();

  return isHome && searchResults.type !== 'notes' ? (
    <AnimatedSectionList
      transition="backgroundColor"
      duration={300}
      ref={sectionListRef}
      sections={data}
      refreshControl={
        <RefreshControl
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressViewOffset={150}
          onRefresh={_onRefresh}
          refreshing={refreshing}
        />
      }
      keyExtractor={_listKeyExtractor}
      renderSectionHeader={_renderSectionHeader}
      onScroll={_onScroll}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={_ListEmptyComponent}
      ListHeaderComponent={_ListHeaderComponent_S}
      contentContainerStyle={{
        width: '100%',
        alignSelf: 'center',
        minHeight: '100%',
      }}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}
      removeClippedSubviews={true}
      ListFooterComponent={_ListFooterComponent}
      renderItem={({item, index}) => <RenderItem item={item} index={index} />}
    />
  ) : (
    <AnimatedFlatlist
      transition="backgroundColor"
      duration={300}
      data={
        searchResults.type === type &&
        focused &&
        searchResults.results.length > 0
          ? searchResults.results
          : data
      }
      refreshControl={
        <RefreshControl
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressViewOffset={150}
          onRefresh={customRefresh ? customRefresh : _onRefresh}
          refreshing={customRefresh ? customRefreshing : refreshing}
        />
      }
      keyExtractor={_listKeyExtractor}
      ListFooterComponent={_ListFooterComponent}
      onScroll={_onScroll}
      ListHeaderComponent={_ListHeaderComponent_S}
      ListEmptyComponent={_ListEmptyComponent}
      contentContainerStyle={{
        width: '100%',
        alignSelf: 'center',
        minHeight: '100%',
      }}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}
      renderItem={({item, index}) => <RenderItem item={item} index={index} />}
    />
  );
};

export default SimpleList;
