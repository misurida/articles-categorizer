import { memo } from 'react';
import { FixedSizeList as List, areEqual } from 'react-window';
import memoize from 'memoize-one';


// If list items are expensive to render,
// Consider using React.memo or shouldComponentUpdate to avoid unnecessary re-renders.
// https://reactjs.org/docs/react-api.html#reactmemo
// https://reactjs.org/docs/react-api.html#reactpurecomponent
const Row = memo(({ data, index, style }: any) => {

  // Data passed to List as "itemData" is available as props.data
  const { items, onClick } = data;
  const item = items[index];

  const handleClick = () => {
    if(onClick) {
      onClick(index, item)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={style}
    >
      {item} is {item.isActive ? 'active' : 'inactive'}
    </div>
  );
}, areEqual);

Row.displayName = "SimpleListRow"

// This helper function memoizes incoming props,
// To avoid causing unnecessary re-renders pure Row components.
// This is only needed since we are passing multiple props with a wrapper object.
// If we were only passing a single, stable value (e.g. items),
// We could just pass the value directly.
const createItemData = memoize((items, onClick) => ({
  items,
  onClick,
}));

// In this example, "items" is an Array of objects to render,
// and "onClick" is a function that updates an item's state.
export default function SimpleList<T>(props: {
  items: T[]
  height?: number
  width?: number
  onClick?: (index: number, item: T) => void
}) {
  // Bundle additional data to list items using the "itemData" prop.
  // It will be accessible to item renderers as props.data.
  // Memoize this data to avoid bypassing shouldComponentUpdate().
  const itemData = createItemData(props.items, props.onClick);

  return (
    <List
      height={props.height || 200}
      itemCount={props.items.length}
      itemData={itemData}
      itemSize={35}
      width={props.width || "100%"}
    >
      {Row}
    </List>
  );
}
