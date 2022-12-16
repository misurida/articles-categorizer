import { memo } from 'react';
import memoize from 'memoize-one';
import { FixedSizeList as List, areEqual } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const Row = memo(({ data, index, style }: any) => {

  // Data passed to List as "itemData" is available as props.data
  const { items, toggleItemActive } = data;
  const item = items[index];

  return (
    <div
      onClick={() => toggleItemActive(index)}
      style={style}
    >
      {item.std.title} is {item.isActive ? 'active' : 'inactive'}
    </div>
  );
}, areEqual);


const createItemData = memoize((items, toggleItemActive) => ({
  items,
  toggleItemActive,
}));


export default function MantineList({ items, toggleItemActive }: any) {


  const itemData = createItemData(items, toggleItemActive);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={items.length}
          itemData={itemData}
          itemSize={35}
          width={width}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
}