import ArgDataRaw from './ArgData.json';
import CompletionDataRaw from './CompletionData.json';
import CompletionTypesRaw from './CompletionTypes.json';
import EncryptionRaw from './Encryption.json';
import ExamplesRaw from './Examples.json';
import HoverDataRaw from './HoverData.json';
import ReturnDataRaw from './ReturnData.json';
import TypeDataRaw from './TypeData.json';

import {
    ArgDataMap,
    ReturnDataMap,
    CompletionDataMap,
    CompletionTypesMap,
    ExamplesMap,
    HoverDataMap,
    TypeDataMap
} from '../types';

export const ArgData = <ArgDataMap><unknown>ArgDataRaw;
export const CompData = <CompletionDataMap><unknown>CompletionDataRaw;
export const CompTypes = <CompletionTypesMap><unknown>CompletionTypesRaw;
export const Encryption = <string[]><unknown>EncryptionRaw;
export const Examples = <ExamplesMap><unknown>ExamplesRaw;
export const HoverData = <HoverDataMap><unknown>HoverDataRaw;
export const ReturnData = <ReturnDataMap><unknown>ReturnDataRaw;
export const TypeData = <TypeDataMap><unknown>TypeDataRaw;
