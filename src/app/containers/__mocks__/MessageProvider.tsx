import { getInstance } from '../../../__mocks__/cache';

export const cacheMock = getInstance();

export const useMessageCache = () => cacheMock;
