import { prisma } from '../../prisma/db';

export async function findLicenseClass(id: string) {
    return prisma.licenseClass.findUnique({ where: { id } });
}
export async function getLicenseClasses() {
    return prisma.licenseClass.findMany({ orderBy: { name: 'asc' } });
}
