export interface PaisCatalogo {
  id: number;
  nombre: string;
  nombreCorto?: string | null;
  nacionalidad?: string | null;
}

export interface CatalogoPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
