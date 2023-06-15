export interface BingMapsResponse<T> {
    authenticationResultCode: string;
    brandLogoUri: string;
    copyright: string;
    resourceSets: ResourceSet<T>[];
    statusCode: number;
    statusDescription: string;
    traceId: string;
}
interface ResourceSet<T> {
    estimatedTotal: number;
    resources: T[];
}
