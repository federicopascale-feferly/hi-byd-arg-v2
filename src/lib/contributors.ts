export interface Contributor {
  name: string;
  vehicle: string;
  type: 'PHEV' | 'EV';
  location?: string;
}

export const CONTRIBUTORS: Contributor[] = [
  {
    name: 'Andrés B.',
    vehicle: 'Chevrolet Captiva',
    type: 'PHEV',
    location: 'Rosario',
  },
];
