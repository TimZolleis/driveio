export const errors = {
    unknown: 'Ein unbekannter Fehler ist aufgetreten',
    login: {
        email: {
            required: 'Bitte gib eine E-Mail an',
            invalid: 'Es konnte kein Benutzer mit dieser E-Mail gefunden werden',
        },
        password: {
            required: 'Bitte gib ein Passwort an',
            invalid: 'Das angegebene Passwort ist ungültig',
        },
    },
    code: {
        required: 'Bitte gib einen 6-stelligen Einladungscode ein',
        invalid: 'Dieser Einladungscode ist ungültig',
    },
    user: {
        notFound: 'Es konnte kein Benutzer gefunden werden',
        emailExists: 'Diese E-Mail existier bereits',
    },
    registration: {
        password: {
            noMatch: 'Beide Passwörter müssen übereinstimmen',
        },
        invalidAttempt: 'Dieser Registrierungsversuch ist ungültig',
        expired:
            'Diese Registrierungssitzung ist abgelaufen. Bitte gib deinen Einladungscode erneut ein',
    },
    form: {
        notEmpty: 'Dieses Feld darf nicht leer sein',
    },
};
