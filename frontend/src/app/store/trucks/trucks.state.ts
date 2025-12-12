import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Truck } from '../../models/truck.model';

export interface TrucksState extends EntityState<Truck> {
  selectedTruckId: string | null;
  loading: boolean;
  error: string | null;
  searchResults: Truck[];
  isSearching: boolean;
}

export const trucksAdapter: EntityAdapter<Truck> = createEntityAdapter<Truck>({
  selectId: (truck) => truck.id
});

export const initialTrucksState: TrucksState = trucksAdapter.getInitialState({
  selectedTruckId: null,
  loading: false,
  error: null,
  searchResults: [],
  isSearching: false
});
