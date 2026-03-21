export function parseCareTeam(careTeams, practitioners) {
    // Build a lookup map from practitioner FHIR ID to resource
    const practLookup = new Map();
    for (const p of practitioners) {
        if (p.id)
            practLookup.set(p.id, p);
    }
    const members = [];
    const seen = new Set(); // deduplicate by name+role
    for (const team of careTeams) {
        for (const participant of team.participant ?? []) {
            const role = participant.role?.[0]?.text
                ?? participant.role?.[0]?.coding?.[0]?.display
                ?? 'Care Team Member';
            const ref = participant.member?.reference ?? '';
            // Extract FHIR ID from reference like "Practitioner/abc123"
            const practId = ref.startsWith('Practitioner/') ? ref.split('/')[1] : null;
            let name;
            let phone;
            let email;
            let specialty;
            if (practId && practLookup.has(practId)) {
                const pract = practLookup.get(practId);
                const nameEntry = pract.name?.[0];
                const given = nameEntry?.given?.join(' ') ?? '';
                const family = nameEntry?.family ?? '';
                const prefix = nameEntry?.prefix?.join(' ') ?? '';
                name = [prefix, given, family].filter(Boolean).join(' ');
                phone = pract.telecom?.find(t => t.system === 'phone')?.value;
                email = pract.telecom?.find(t => t.system === 'email')?.value;
                specialty = pract.qualification?.[0]?.code?.text
                    ?? pract.qualification?.[0]?.code?.coding?.[0]?.display;
            }
            else {
                name = participant.member?.display ?? 'Unknown';
            }
            const key = `${role}|${name}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            members.push({ role, name, specialty, phone, email });
        }
    }
    return members;
}
//# sourceMappingURL=care-team.js.map