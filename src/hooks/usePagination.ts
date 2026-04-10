import { useState, useMemo } from 'react';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationMethods {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
}

export const usePagination = <T>(items: T[], initialPageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginationState = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      currentPage: Math.min(currentPage, totalPages),
      pageSize,
      totalItems,
      totalPages,
    };
  }, [items.length, pageSize, currentPage]);

  const paginatedItems = useMemo(() => {
    const { currentPage, pageSize } = paginationState;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, paginationState]);

  const methods: PaginationMethods = {
    goToPage: (page: number) => {
      const validPage = Math.max(1, Math.min(page, paginationState.totalPages));
      setCurrentPage(validPage);
    },
    nextPage: () => {
      if (paginationState.currentPage < paginationState.totalPages) {
        setCurrentPage((prev) => prev + 1);
      }
    },
    prevPage: () => {
      if (paginationState.currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
    setPageSize: (size: number) => {
      setPageSize(Math.max(1, size));
      setCurrentPage(1);
    },
  };

  return {
    paginatedItems,
    ...paginationState,
    ...methods,
  };
};
