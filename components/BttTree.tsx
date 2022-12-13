import React, { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import {
  Tree,
  NodeModel,
  MultiBackend,
  getBackendOptions,
  useDragOver,
  TreeMethods
} from "@minoru/react-dnd-treeview";
import { ActionIcon, Badge, Box, Button, Checkbox, ColorSwatch, createStyles, Group, Menu, Text, Tooltip } from "@mantine/core";
import { Topic } from "../utils/types";
import { IconChevronRight, IconDotsVertical } from "@tabler/icons";
import { getContrastColor } from "./annotations/AnnotationsEditor";


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
    backgroundColor: "#e8f0fe"
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
  }
}));


export function CustomNode(props: {
  node: TreeItem;
  depth: number;
  isOpen: boolean;
  isSelected: boolean;
  onToggle: (id: NodeModel["id"]) => void;
  onSelect: (node: NodeModel) => void;
  onDelete?: (node: NodeModel) => void
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

  const deleteTopic = (e: React.MouseEvent) => {
    debugger;
    e.stopPropagation()
    if(props.onDelete) {
      props.onDelete(props.node)
    }
  }

  return (
    <div
      className={cx(classes.treeNode, classes.rootNode)}
      style={{ paddingInlineStart: indent }}
      {...dragOverProps}
    >
      <div className={cx(classes.expandIconWrapper, { [classes.expandIconWrapperOpen]: props.isOpen })}>
        {props.node.droppable && (
          <div onClick={handleToggle}>
            <IconChevronRight size={14} />
          </div>
        )}
      </div>
      <div>
        <Checkbox
          color="primary"
          size="sm"
          checked={props.isSelected}
          onChange={handleSelect}
        />
      </div>
      <div className={classes.labelGridItem} onClick={handleSelect}>
        <Group spacing="xs" align="center" noWrap>
          <ColorSwatch color={props.node.color || "transparent"}>
            <Text weight="bold" size="xs" sx={{ color: props.node.color ? getContrastColor(props.node.color) : "transparent" }} title={props.node.id.toString()}>{props.node.number}</Text>
          </ColorSwatch>
          <Text>{props.node.text}</Text>
          <Tooltip withArrow label="Linked articles">
            <Badge ml="xs" size="sm" variant="outline">{props.node.numberOfArticles}</Badge>
          </Tooltip>
          <Menu width={200} shadow="md">
            <Menu.Target>
              <ActionIcon onClick={e => e.stopPropagation()}>
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item onClick={deleteTopic}>
                Delete topic
              </Menu.Item>

            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </div>
  );
};

/**
 * Tree component wrapper based on react-dnd-treeview.
 * @see https://minop1205.github.io/react-dnd-treeview/?path=/docs/basic-examples-minimum-configuration--minimum-configuration-story
 */
export default function BttTree(props: {
  data: Topic[]
  onChange: (value: Topic[]) => void
  onSelect?: (value: NodeModel) => void
  selection: string[]
  onDelete?: (node: NodeModel) => void
}) {

  const buildTreeItems = (data: Topic[]) => {
    return data.map(e => ({
      id: e.id,
      text: e.name,
      droppable: true,
      parent: e.parentId || 0,
      numberOfArticles: e.linkedArticles?.length,
      number: e.id.replace("title_model_", ""),
      color: e.color
    } as TreeItem))
  }

  const { classes } = useStyles()
  const [treeData, setTreeData] = useState<NodeModel[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<NodeModel[]>([]);

  useEffect(() => {
    setSelectedNodes(buildTreeItems(props.data.filter(e => props.selection.includes(e.id))))
  }, [props.selection, props.data])

  useEffect(() => {
    setTreeData(buildTreeItems(props.data))
  }, [props.data])

  const handleDrop = (newTree: NodeModel[]) => {
    const newMap: Record<string, string> = newTree.reduce((a, e) => ({ ...a, [e.id]: e.parent }), {})
    const newTopics: Topic[] = props.data.map(e => ({ ...e, parentId: newMap[e.id] }))
    props.onChange(newTopics)
  };

  const handleSelect = (node: NodeModel) => {
    if (props.onSelect) {
      props.onSelect(node)
    }
    else {
      const item = selectedNodes.find((n) => n.id === node.id);
      if (!item) {
        setSelectedNodes([...selectedNodes, node]);
      } else {
        setSelectedNodes(selectedNodes.filter((n) => n.id !== node.id));
      }
    }

  };


  const ref = useRef<TreeMethods>(null);
  const handleOpenAll = () => ref.current?.openAll();
  const handleCloseAll = () => ref.current?.closeAll();

  return (
    <Box>
      <Group spacing="xs">
        <Button compact variant="default" onClick={handleOpenAll}>Open all</Button>
        <Button compact variant="default" onClick={handleCloseAll}>Close all</Button>
      </Group>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <div className={classes.app}>
          <Tree
            ref={ref}
            tree={treeData}
            rootId={0}
            sort={false}
            render={(
              node: NodeModel<Topic>,
              { depth, isOpen, onToggle }
            ) => (
              <CustomNode
                node={node}
                depth={depth}
                isOpen={isOpen}
                isSelected={!!selectedNodes.find((n) => n.id === node.id)}
                onToggle={onToggle}
                onSelect={handleSelect}
                onDelete={props.onDelete}
              />
            )}
            onDrop={handleDrop}
            classes={{
              root: classes.treeRoot,
              draggingSource: classes.draggingSource,
              dropTarget: classes.dropTarget
            }}
          />
        </div>
      </DndProvider>
    </Box>
  );
}

