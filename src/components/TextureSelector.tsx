import { useEffect } from 'react';
import * as images from '../images/images';
import {
  HOTBAR_ITEMS,
  inventoryItemLabels,
  type InventoryItem,
  useStore,
} from '../hooks/useStore';
import { useKeyboard } from '../hooks/useKeyboard';

const imageMap = images as Partial<Record<InventoryItem, string>>;

export const TextureSelector = () => {
  const selectedItem = useStore((state) => state.selectedItem);
  const inventory = useStore((state) => state.inventory);
  const selectItem = useStore((state) => state.selectItem);
  const { hand, dirt, grass, log, wood, wheat, leaves } = useKeyboard();

  useEffect(() => {
    const hotbarSelections: Record<InventoryItem, boolean> = {
      hand,
      dirt,
      grass,
      log,
      wood,
      wheat,
      leaves,
    };

    const pressedItem = HOTBAR_ITEMS.find((item) => hotbarSelections[item]);

    if (pressedItem) {
      selectItem(pressedItem);
    }
  }, [dirt, grass, hand, leaves, log, selectItem, wheat, wood]);

  return (
    <div className="texture-selector" aria-label="Hotbar">
      {HOTBAR_ITEMS.map((item, index) => (
        <div
          key={item}
          className={`texture-slot ${item === selectedItem ? 'active' : ''}`}
        >
          <span className="texture-key">{index + 1}</span>
          {imageMap[item] ? (
            <img
              src={imageMap[item]}
              alt={inventoryItemLabels[item]}
              className="texture-box"
            />
          ) : (
            <div className="texture-box hand-slot">HAND</div>
          )}
          <div className="texture-count">{item === 'hand' ? '' : inventory[item]}</div>
          <div className="texture-label">{inventoryItemLabels[item]}</div>
        </div>
      ))}
    </div>
  );
};
