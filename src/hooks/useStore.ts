import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { createNoise2D } from 'simplex-noise';
import { debugInfo, debugWarn } from '../utils/debug';

export const BLOCK_KINDS = ['dirt', 'grass', 'log', 'wood', 'leaves'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const HOTBAR_ITEMS = ['hand', 'dirt', 'grass', 'log', 'wood', 'wheat', 'leaves'] as const;
export type InventoryItem = (typeof HOTBAR_ITEMS)[number];

export const PLACEABLE_ITEMS = ['dirt', 'grass', 'log', 'wood', 'leaves'] as const;
export type PlaceableItem = (typeof PLACEABLE_ITEMS)[number];

export type Inventory = Record<InventoryItem, number>;

export interface Block {
  key: string;
  pos: [number, number, number];
  kind: BlockKind;
}

interface StoredWorldState {
  blocks: Block[];
  inventory: Inventory;
  selectedItem: InventoryItem;
}

interface StoreState {
  selectedItem: InventoryItem;
  inventory: Inventory;
  blocks: Block[];
  selectItem: (item: InventoryItem) => void;
  placeSelectedBlock: (x: number, y: number, z: number) => boolean;
  harvestBlock: (x: number, y: number, z: number) => boolean;
  craftWoodFromLog: () => boolean;
  saveWorld: () => void;
  resetWorld: () => void;
}

const STORAGE_KEY = 'minecraft-survival-state-v1';
const WORLD_SIZE = 20;

const ITEM_LABELS: Record<InventoryItem, string> = {
  hand: 'Hand',
  dirt: 'Dirt',
  grass: 'Grass',
  log: 'Log',
  wood: 'Planks',
  wheat: 'Wheat',
  leaves: 'Leaves',
};

export const inventoryItemLabels = ITEM_LABELS;

const createInitialInventory = (): Inventory => ({
  hand: 1,
  dirt: 0,
  grass: 0,
  log: 0,
  wood: 0,
  wheat: 0,
  leaves: 0,
});

const cloneInventory = (inventory: Inventory): Inventory => ({ ...inventory });

const isBlockKind = (value: unknown): value is BlockKind =>
  typeof value === 'string' && BLOCK_KINDS.includes(value as BlockKind);

const isInventoryItem = (value: unknown): value is InventoryItem =>
  typeof value === 'string' && HOTBAR_ITEMS.includes(value as InventoryItem);

const isInventory = (value: unknown): value is Inventory =>
  typeof value === 'object' &&
  value !== null &&
  HOTBAR_ITEMS.every((item) => item in value && typeof (value as Inventory)[item] === 'number');

const isStoredBlock = (value: unknown): value is Block =>
  typeof value === 'object' &&
  value !== null &&
  'key' in value &&
  'pos' in value &&
  'kind' in value &&
  typeof value.key === 'string' &&
  Array.isArray(value.pos) &&
  value.pos.length === 3 &&
  value.pos.every((entry) => typeof entry === 'number') &&
  isBlockKind(value.kind);

const isStoredWorldState = (value: unknown): value is StoredWorldState =>
  typeof value === 'object' &&
  value !== null &&
  'blocks' in value &&
  'inventory' in value &&
  'selectedItem' in value &&
  Array.isArray(value.blocks) &&
  value.blocks.every(isStoredBlock) &&
  isInventory(value.inventory) &&
  isInventoryItem(value.selectedItem);

const blockKey = (x: number, y: number, z: number) => `${x}:${y}:${z}`;

const hashCoordinate = (x: number, z: number, salt: number) => {
  const raw = Math.sin(x * 12.9898 + z * 78.233 + salt * 37.719) * 43758.5453;
  return raw - Math.floor(raw);
};

const addInventoryItems = (
  inventory: Inventory,
  additions: Partial<Record<InventoryItem, number>>
) => {
  const nextInventory = cloneInventory(inventory);

  Object.entries(additions).forEach(([item, amount]) => {
    if (!amount) {
      return;
    }

    nextInventory[item as InventoryItem] += amount;
  });

  return nextInventory;
};

const isPlaceableItem = (item: InventoryItem): item is PlaceableItem =>
  PLACEABLE_ITEMS.includes(item as PlaceableItem);

const generateProceduralBlocks = () => {
  const noise2D = createNoise2D();
  const blocksByPosition = new Map<string, Block>();
  const surfaceHeights = new Map<string, number>();

  const addBlock = (x: number, y: number, z: number, kind: BlockKind) => {
    const key = blockKey(x, y, z);

    if (blocksByPosition.has(key)) {
      return;
    }

    blocksByPosition.set(key, {
      key: nanoid(),
      pos: [x, y, z],
      kind,
    });
  };

  for (let x = -WORLD_SIZE; x < WORLD_SIZE; x += 1) {
    for (let z = -WORLD_SIZE; z < WORLD_SIZE; z += 1) {
      const baseHeight = Math.floor(noise2D(x / 14, z / 14) * 3) + 4;

      for (let y = 0; y < baseHeight; y += 1) {
        addBlock(x, y, z, y === baseHeight - 1 ? 'grass' : 'dirt');
      }

      surfaceHeights.set(`${x}:${z}`, baseHeight - 1);
    }
  }

  for (let x = -WORLD_SIZE + 3; x < WORLD_SIZE - 3; x += 1) {
    for (let z = -WORLD_SIZE + 3; z < WORLD_SIZE - 3; z += 1) {
      const surfaceY = surfaceHeights.get(`${x}:${z}`);

      if (surfaceY === undefined) {
        continue;
      }

      const treeChance = hashCoordinate(x, z, 11);
      if (treeChance < 0.92) {
        continue;
      }

      if (
        hashCoordinate(x - 2, z, 19) > 0.92 ||
        hashCoordinate(x + 2, z, 23) > 0.92 ||
        hashCoordinate(x, z - 2, 29) > 0.92 ||
        hashCoordinate(x, z + 2, 31) > 0.92
      ) {
        continue;
      }

      const trunkHeight = 3 + Math.floor(hashCoordinate(x, z, 41) * 2);

      for (let trunkY = 1; trunkY <= trunkHeight; trunkY += 1) {
        addBlock(x, surfaceY + trunkY, z, 'log');
      }

      const canopyBase = surfaceY + trunkHeight;
      for (let leafX = -2; leafX <= 2; leafX += 1) {
        for (let leafZ = -2; leafZ <= 2; leafZ += 1) {
          for (let leafY = 0; leafY <= 2; leafY += 1) {
            const distance = Math.abs(leafX) + Math.abs(leafZ) + leafY;
            if (distance > 4) {
              continue;
            }

            if (leafX === 0 && leafZ === 0 && leafY <= 1) {
              continue;
            }

            addBlock(x + leafX, canopyBase + leafY, z + leafZ, 'leaves');
          }
        }
      }

      addBlock(x, canopyBase + 3, z, 'leaves');
    }
  }

  const blocks = [...blocksByPosition.values()];

  debugInfo('store', 'Generated survival world', {
    blockCount: blocks.length,
    worldSize: WORLD_SIZE,
  });

  return blocks;
};

const getStoredWorldState = (): StoredWorldState | null => {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');

    if (!isStoredWorldState(parsed)) {
      return null;
    }

    debugInfo('store', 'Loaded survival state from localStorage', {
      key: STORAGE_KEY,
      blockCount: parsed.blocks.length,
      selectedItem: parsed.selectedItem,
    });

    return {
      blocks: parsed.blocks,
      inventory: cloneInventory(parsed.inventory),
      selectedItem: parsed.selectedItem,
    };
  } catch {
    debugWarn('store', 'Failed to parse survival state from localStorage', { key: STORAGE_KEY });
    return null;
  }
};

const setStoredWorldState = (value: StoredWorldState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  debugInfo('store', 'Saved survival state to localStorage', {
    key: STORAGE_KEY,
    blockCount: value.blocks.length,
    selectedItem: value.selectedItem,
  });
};

const initialState = getStoredWorldState() ?? {
  blocks: generateProceduralBlocks(),
  inventory: createInitialInventory(),
  selectedItem: 'hand' as InventoryItem,
};

debugInfo('store', 'Initialized survival store', {
  blockCount: initialState.blocks.length,
  selectedItem: initialState.selectedItem,
  inventory: initialState.inventory,
});

const harvestDropsByBlock: Record<BlockKind, Partial<Record<InventoryItem, number>>> = {
  dirt: { dirt: 1 },
  grass: { grass: 1, wheat: 1 },
  log: { log: 1 },
  wood: { wood: 1 },
  leaves: { leaves: 1 },
};

export const useStore = create<StoreState>((set, get) => ({
  selectedItem: initialState.selectedItem,
  inventory: cloneInventory(initialState.inventory),
  blocks: initialState.blocks,
  selectItem: (item) => {
    debugInfo('store', 'Selected hotbar item', {
      item,
      label: ITEM_LABELS[item],
    });

    set(() => ({ selectedItem: item }));
  },
  placeSelectedBlock: (x, y, z) => {
    const { blocks, inventory, selectedItem } = get();

    if (!isPlaceableItem(selectedItem)) {
      return false;
    }

    if (inventory[selectedItem] <= 0) {
      debugWarn('store', 'Cannot place block without inventory', {
        selectedItem,
        x,
        y,
        z,
      });
      return false;
    }

    if (blocks.some((block) => block.pos[0] === x && block.pos[1] === y && block.pos[2] === z)) {
      return false;
    }

    set((prev) => ({
      blocks: [
        ...prev.blocks,
        {
          key: nanoid(),
          pos: [x, y, z],
          kind: selectedItem,
        },
      ],
      inventory: {
        ...prev.inventory,
        [selectedItem]: prev.inventory[selectedItem] - 1,
      },
    }));

    debugInfo('store', 'Placed block from inventory', {
      selectedItem,
      x,
      y,
      z,
    });

    return true;
  },
  harvestBlock: (x, y, z) => {
    const targetBlock = get().blocks.find(
      (block) => block.pos[0] === x && block.pos[1] === y && block.pos[2] === z
    );

    if (!targetBlock) {
      return false;
    }

    const drops = harvestDropsByBlock[targetBlock.kind];

    set((prev) => ({
      blocks: prev.blocks.filter((block) => block.key !== targetBlock.key),
      inventory: addInventoryItems(prev.inventory, drops),
    }));

    debugInfo('store', 'Harvested block', {
      kind: targetBlock.kind,
      x,
      y,
      z,
      drops,
    });

    return true;
  },
  craftWoodFromLog: () => {
    const { inventory } = get();

    if (inventory.log <= 0) {
      debugWarn('store', 'Cannot craft planks without logs');
      return false;
    }

    set((prev) => ({
      inventory: {
        ...prev.inventory,
        log: prev.inventory.log - 1,
        wood: prev.inventory.wood + 4,
      },
    }));

    debugInfo('store', 'Crafted planks from logs', {
      logsRemaining: inventory.log - 1,
      planksAfterCraft: inventory.wood + 4,
    });

    return true;
  },
  saveWorld: () => {
    const state = get();
    setStoredWorldState({
      blocks: state.blocks,
      inventory: cloneInventory(state.inventory),
      selectedItem: state.selectedItem,
    });
  },
  resetWorld: () => {
    const nextBlocks = generateProceduralBlocks();
    const nextInventory = createInitialInventory();

    debugInfo('store', 'Resetting survival world');

    set(() => ({
      blocks: nextBlocks,
      inventory: nextInventory,
      selectedItem: 'hand',
    }));
  },
}));
