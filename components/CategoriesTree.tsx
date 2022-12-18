import React, { useEffect, useMemo, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import {
  Tree,
  NodeModel,
  MultiBackend,
  getBackendOptions,
  useDragOver,
  TreeMethods,
  DragLayerMonitorProps,
  DropOptions
} from "@minoru/react-dnd-treeview";
import { ActionIcon, Badge, Box, Button, Checkbox, Collapse, ColorSwatch, createStyles, Group, Menu, Switch, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { IconChevronRight, IconDotsVertical, IconEdit, IconRefresh, IconTrash } from "@tabler/icons";
import { getContrastColor, getObjectValue } from "../utils/helpers";
import { Category } from "../utils/types";
import { passScoreTest, useDatabase } from "../hooks/useDatabase";


export interface TreeItem {
  id: number | string;
  parent: number | string | 0;
  droppable?: boolean;
  text: string;
  color?: string
  number?: string
  numberOfArticles?: number
}

const useStyles = createStyles((theme) => ({
  app: {
    height: "100%"
  },
  treeRoot: {
    height: "100%",
    listStyleType: "none",
    paddingLeft: 0,
    "& ul": {
      listStyleType: "none",
      paddingLeft: "1.5em"
    }
  },
  draggingSource: {
    opacity: ".3"
  },
  dropTarget: {

  },
  treeNode: {
    "&:hover": {
      background: theme.colorScheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
    }
  },
  rootNode: {
    alignItems: "center",
    display: "grid",
    gridTemplateColumns: "auto auto 1fr auto",
    height: 32,
    paddingInlineEnd: 8
  },
  expandIconWrapper: {
    alignItems: "center",
    fontSize: 0,
    cursor: "pointer",
    display: "flex",
    height: 24,
    justifyContent: "center",
    width: 24,
    transition: "transform linear .1s",
    transform: "rotate(0deg)",
  },
  expandIconWrapperOpen: {
    transform: "rotate(90deg)",
  },
  labelGridItem: {
    paddingInlineStart: 8,
    cursor: "pointer"
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    marginLeft: 3
  },
  previewRoot: {
    gap: 8,
    gridTemplateColumns: "auto auto",
    display: "inline-grid",
    backgroundColor: theme.colors.blue[8],
    borderRadius: 4,
    boxShadow: "0 12px 24px -6px rgba(0, 0, 0, .25), 0 0 0 1px rgba(0, 0, 0, .08)",
    color: "#fff",
    fontSize: 14,
    padding: "4px 8px",
    pointerEvents: "none",
  },
  previewLabel: {
    alignItems: "flex-start",
    display: "flex"
  },
  placeholderRoot: {
    backgroundColor: "#1967d2",
    height: 2,
    position: "absolute",
    right: 0,
    transform: "translateY(-50%)",
    top: 0
  },
  placeholderContainer: {
    position: "relative"
  }
}))


export const computeDepth = (nodes: TreeItem[], node?: TreeItem, depth = 0): number => {
  if (node?.parent) {
    const p = nodes.find(n => n.id === node.parent)
    if (p) {
      return computeDepth(nodes, p, depth + 1)
    }
  }
  return depth
}


export function Placeholder(props: {
  node: NodeModel
  depth: number
}) {

  const { classes } = useStyles()
  const left = props.depth * 24

  return (
    <div className={classes.placeholderRoot} style={{ left }}></div>
  );
};

export function CustomDragPreview(props: {
  monitorProps: DragLayerMonitorProps<Category>;
}) {

  const item = props.monitorProps.item;
  const { classes } = useStyles()

  return (
    <div className={classes.previewRoot}>
      <div className={classes.previewLabel}>{item.text}</div>
    </div>
  );
};



export function CustomNode(props: {
  node: TreeItem;
  depth: number;
  maxDepth?: number;
  isOpen: boolean;
  isSelected: boolean;
  isDroppable?: boolean;
  count: number;
  onToggle: (id: NodeModel["id"]) => void
  onSelect: (node: NodeModel) => void
  onDelete?: (node: NodeModel) => void
  onEdit?: (node: NodeModel) => void
}) {

  const { classes, cx } = useStyles()
  const { id } = props.node;
  const indent = props.depth * 24;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.onToggle(props.node.id);
  };

  const dragOverProps = useDragOver(id, props.isOpen, props.onToggle);
  const handleSelect = () => props.onSelect(props.node);

  const editItem = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (props.onEdit) {
      props.onEdit(props.node)
    }
  }

  const deleteItem = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (props.onDelete) {
      props.onDelete(props.node)
    }
  }

  return (
    <div
      className={cx(classes.treeNode, classes.rootNode)}
      style={{ paddingInlineStart: indent }}
      {...dragOverProps}
    >
      {props.isDroppable !== false && props.node.droppable !== false && (
        <div className={cx(classes.expandIconWrapper, { [classes.expandIconWrapperOpen]: props.isOpen })}>
          <div onClick={handleToggle}>
            <ThemeIcon variant="light" size="xs">
              <IconChevronRight size={14} />
            </ThemeIcon>
          </div>
        </div>
      )}
      <Checkbox
        className={classes.checkbox}
        color="primary"
        size="sm"
        checked={props.isSelected}
        onChange={handleSelect}
      />
      <div className={classes.labelGridItem} onClick={handleSelect}>
        <Group spacing="xs" align="center" noWrap>
          <ColorSwatch size={20} color={props.node.color || "transparent"}>
            <Text weight="bold" size="xs" sx={{ color: props.node.color ? getContrastColor(props.node.color) : "transparent" }} title={props.node.id.toString()}>{props.node.number}</Text>
          </ColorSwatch>
          <Text>{props.node.text}</Text>
          <Menu shadow="md">
            <Menu.Target>
              <ActionIcon onClick={(e: any) => e.stopPropagation()}>
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={editItem} icon={<IconEdit size={14} />}>Edit category</Menu.Item>
              <Menu.Item onClick={deleteItem} icon={<IconTrash size={14} />}>Delete category</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          {props.count && (<Badge variant="outline">{props.count}</Badge>)}
        </Group>
      </div>
    </div>
  );
};

/**
 * Tree component wrapper based on react-dnd-treeview.
 * @see https://minop1205.github.io/react-dnd-treeview/?path=/docs/basic-examples-minimum-configuration--minimum-configuration-story
 */
export default function CategoriesTree(props: {
  data: Category[]
  onChange: (value: Category[]) => void
  onSelect?: (value: NodeModel) => void
  selection?: string[]
  onDelete?: (node: NodeModel) => void
  onEdit?: (node: NodeModel) => void
  buttonChildren?: React.ReactNode
}) {

  const buildTreeItems = (data: Category[]) => {
    return data.map(e => ({
      id: e.id,
      text: e.name,
      droppable: true,
      parent: e.parentId || 0,
      color: e.color
    } as TreeItem))
  }

  const maxDepth = 1
  const { filteredArticles, categories } = useDatabase()
  const { classes } = useStyles()
  const [treeData, setTreeData] = useState<NodeModel<Category>[]>(buildTreeItems(props.data));
  const [editTree, setEditTree] = useState(false)

  const selection = useMemo(() => {
    return props.selection === undefined ? [] : props.selection
  }, [props.selection])

  useEffect(() => {
    setTreeData(buildTreeItems(props.data))
  }, [props.data])

  const handleDrop = (newTree: NodeModel<Category>[]) => {
    const newTopics = newTree.map(n => {
      let cat = props.data.find(e => e.id === n.id) || { id: n.id } as Category
      cat.parentId = n.parent ? n.parent.toString() : null
      return cat
    })
    props.onChange(newTopics)
    setTreeData(newTree)
  };

  const handleSelect = (node: NodeModel) => {
    if (!!props.onSelect) {
      props.onSelect(node)
    }
  };

  const articlesCount = (id: string) => {
    const cat = categories.find(c => c.id == id)
    if (!filteredArticles || !filteredArticles.length || !cat) {
      return 0
    }
    return filteredArticles.filter(a => passScoreTest(a, cat)).length
  }

  const ref = useRef<TreeMethods>(null);
  const handleOpenAll = () => ref.current?.openAll();
  const handleCloseAll = () => ref.current?.closeAll();

  return (
    <Box>
      <Group spacing="xs" align="center">
        {props.buttonChildren}
        <Tooltip label="Edit Tree" withArrow>
          <Box>
            <Switch
              size="md"
              sx={{ display: "flex", alignItems: "center" }}
              onLabel="DROP" offLabel="LOCK"
              checked={editTree}
              onChange={(event) => setEditTree(event.currentTarget.checked)}
            />
          </Box>
        </Tooltip>
        <Collapse in={editTree}>
          <Button.Group>
            <Button sx={{ fontWeight: 400 }} compact variant="default" onClick={handleOpenAll}>Open all</Button>
            <Button sx={{ fontWeight: 400 }} compact variant="default" onClick={handleCloseAll}>Close all</Button>
          </Button.Group>
        </Collapse>
      </Group>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <div className={classes.app}>
          <Tree<Category>
            ref={ref}
            tree={treeData}
            rootId={0}
            sort={false}
            render={(node: NodeModel<Category>, { depth, isOpen, onToggle }) => (
              <CustomNode
                node={node}
                depth={depth}
                maxDepth={maxDepth}
                isOpen={isOpen}
                isDroppable={editTree && computeDepth(treeData, node) < maxDepth}
                isSelected={selection.includes(node.id.toString())}
                count={articlesCount(node.id.toString())}
                onToggle={onToggle}
                onSelect={handleSelect}
                onDelete={props.onDelete}
                onEdit={props.onEdit}
              />
            )}
            insertDroppableFirst={false}
            dropTargetOffset={10}
            dragPreviewRender={(monitorProps) => editTree ? (
              <CustomDragPreview monitorProps={monitorProps} />
            ) : (<></>)}
            placeholderRender={(node, { depth }) => (
              <Placeholder node={node} depth={depth} />
            )}
            onDrop={handleDrop}
            initialOpen={true}
            canDrop={(tree, { dragSource, dropTarget }) => editTree && dragSource?.id !== dropTarget?.id && computeDepth(tree, dropTarget) < maxDepth}
            classes={{
              root: classes.treeRoot,
              draggingSource: classes.draggingSource,
              dropTarget: classes.dropTarget,
              placeholder: classes.placeholderContainer
            }}
          />
        </div>
      </DndProvider>
    </Box>
  );
}

