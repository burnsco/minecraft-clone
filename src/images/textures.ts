import {
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three';

import dirtImg from '../assets/dirt.png';
import grassSideImg from '../assets/grass_block_side.png';
import grassTopImg from '../assets/grass_block_top.png';
import leavesImg from '../assets/oak_leaves.png';
import logSideImg from '../assets/oak_log.png';
import logTopImg from '../assets/oak_log_top.png';
import wheatImg from '../assets/wheat_stage7.png';
import woodImg from '../assets/oak_planks.png';

const textureLoader = new TextureLoader();

const configureTexture = (label: string, texture: Texture) => {
  texture.name = label;
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  return texture;
};

const loadTexture = (label: string, url: string) =>
  configureTexture(label, textureLoader.load(url));

export const dirtTexture = loadTexture('dirt', dirtImg);
export const grassTopTexture = loadTexture('grass-top', grassTopImg);
export const grassSideTexture = loadTexture('grass-side', grassSideImg);
export const logTexture = loadTexture('log-side', logSideImg);
export const logTopTexture = loadTexture('log-top', logTopImg);
export const woodTexture = loadTexture('wood', woodImg);
export const leavesTexture = loadTexture('leaves', leavesImg);
export const wheatTexture = loadTexture('wheat', wheatImg);
export const groundTexture = loadTexture('ground', grassTopImg);

groundTexture.wrapS = RepeatWrapping;
groundTexture.wrapT = RepeatWrapping;
groundTexture.repeat.set(100, 100);
