import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Truck, TruckStatus } from '../../models/truck.model';

export interface TrucksState extends EntityState<Truck> {
  selectedTruckId: string | null;
  loading: boolean;
  error: string | null;
  searchResults: Truck[];
  isSearching: boolean;
  // T106: Status filters for US2
  statusFilters: TruckStatus[];
}

export const trucksAdapter: EntityAdapter<Truck> = createEntityAdapter<Truck>({
  selectId: (truck) => truck.id
});

export const initialTrucksState: TrucksState = trucksAdapter.getInitialState({
  selectedTruckId: null,
  loading: false,
  error: null,
  searchResults: [],
  isSearching: false,
  // All statuses selected by default (show all trucks)
  statusFilters: [TruckStatus.ACTIVE, TruckStatus.IDLE, TruckStatus.OFFLINE]
});
