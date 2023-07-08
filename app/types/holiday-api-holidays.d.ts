export type HolidayApiResponse = Holiday[];

export interface Holiday {
    id: string;
    startDate: string;
    endDate: string;
    type: string;
    name: Name[];
    nationwide: boolean;
    subdivisions?: Subdivision[];
}

export interface Name {
    language: string;
    text: string;
}

export interface Subdivision {
    code: string;
    shortName: string;
}
