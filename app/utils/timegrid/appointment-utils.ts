import type { Appointment } from '~/components/ui/TableTimeGrid';

export function getOverlappingAppointmentGroups(appointments: Appointment[]) {
    const sortedAppointments = appointments.slice().sort((a, b) => {
        return a.start < b.start ? -1 : 1;
    });

    // Initialize an array to store the overlapping appointment groups
    const overlappingGroups: Appointment[][] = [];

    // Initialize the first group with the first appointment
    overlappingGroups.push([sortedAppointments[0]]);

    // Iterate over the sorted appointments to find overlaps and merge them into groups
    for (let i = 1; i < sortedAppointments.length; i++) {
        const currentAppointment = sortedAppointments[i];
        let foundGroup = false;

        // Check if the current appointment overlaps with any existing group
        for (let j = 0; j < overlappingGroups.length; j++) {
            const group = overlappingGroups[j];
            const lastAppointment = group[group.length - 1];

            if (currentAppointment.start <= lastAppointment.end) {
                // Appointments overlap, add the current appointment to the group
                group.push(currentAppointment);
                foundGroup = true;
                break;
            }
        }

        if (!foundGroup) {
            // Create a new group for the current appointment
            overlappingGroups.push([currentAppointment]);
        }
    }

    return overlappingGroups;
}
