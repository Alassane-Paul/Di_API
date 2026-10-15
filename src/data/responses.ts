import { constants } from './constants';

export interface CallbackMessage {
  CODE: string;
  MESSAGE: string;
}

export const responses = {
  HTTP_CODES: {
    RESULT_OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    ALREADY_REPORTED: 208,
    VALIDATION_ERROR: 400,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    LOCKED: 423,
    TOO_MANY: 429,
    SERVER_ERROR: 500,
    INTERNAL_SERVER_ERROR: 500,
  },

  CALL_BACK_MESSAGES: {
    // Generics
    SUCCESS: { CODE: '0', MESSAGE: 'Succès !' },
    UNKNOWN_PROBLEM: { CODE: 'ERC-00000-DI', MESSAGE: "Un problème d'origine inconnue est survenu lors du traitement de votre demande." },
    ALL_FIELDS_EMPTY: { CODE: 'ERC-00005-DI', MESSAGE: "Aucun champ n'a été fourni." },
    RECORD_NOT_FOUND: { CODE: 'ERC-00011-DI', MESSAGE: "L'enregistrement n'a pas été trouvé." },
    FORBIDDEN_PERMISSION: { CODE: 'ERC-00001-DI', MESSAGE: "Vous n'avez pas la permission d'effectuer cette action." },
    FATAL_ERROR: { CODE: 'ERC-00002-DI', MESSAGE: 'Une erreur fatale est survenue sur le serveur.' },
    LIST_RETRIEVED: { CODE: 'ERC-00003-DI', MESSAGE: 'Liste récupérée avec succès.' },
    UNAUTHORIZED_USER: { CODE: 'ERC-00006-DI', MESSAGE: 'Utilisateur non autorisé ou session invalide.' },
    EXPIRED_SESSION: { CODE: 'ERC-00013-DI', MESSAGE: 'Session expirée. Veuillez vous reconnecter.' },
    DEVICE_ID_MISSING: { CODE: 'ERC-00020-DI', MESSAGE: "L'identifiant d'appareil est requis." },

    // Auth & Users
    INVALID_USER_CREDENTIALS: { CODE: 'ERC-00014-DI', MESSAGE: 'Nom d’utilisateur ou mot de passe incorrect.' },
    USER_ALREADY_EXISTS: { CODE: 'ERC-00010-DI', MESSAGE: 'Ce nom d’utilisateur ou adresse email est déjà utilisé.' },
    USERNAME_REQUIRED: { CODE: 'ERC-00007-DI', MESSAGE: 'Le nom d’utilisateur est requis.' },
    INVALID_USERNAME: { CODE: 'ERC-00008-DI', MESSAGE: `Le nom d’utilisateur doit comporter entre ${constants.LENGTHS.USERNAME.MIN} et ${constants.LENGTHS.USERNAME.MAX} caractères.` },
    INVALID_EMAIL: { CODE: 'ERC-00009-DI', MESSAGE: 'Adresse email invalide.' },
    INVALID_PASSWORD: { CODE: 'ERC-00015-DI', MESSAGE: `Le mot de passe doit comporter au moins ${constants.LENGTHS.PASSWORD.MIN} caractères.` },
    USER_NOT_FOUND: { CODE: 'ERC-00073-DI', MESSAGE: "Cet utilisateur n'existe pas ou plus." },
    PROFILE_UPDATED: { CODE: 'ERC-00071-DI', MESSAGE: 'Profil mis à jour avec succès.' },
    REGISTRATION_SUCCESS: { CODE: 'ERC-00019-DI', MESSAGE: 'Inscription réussie.' },
    LOGIN_SUCCESS: { CODE: 'ERC-00021-DI', MESSAGE: 'Connexion réussie.' },

    // Conversations
    CONVERSATION_NOT_FOUND: { CODE: 'ERC-00100-DI', MESSAGE: 'Conversation introuvable.' },
    CONVERSATION_CREATED: { CODE: 'ERC-00101-DI', MESSAGE: 'Conversation créée avec succès.' },
    CONVERSATION_UPDATED: { CODE: 'ERC-00102-DI', MESSAGE: 'Conversation mise à jour.' },
    PARTICIPANT_ADDED: { CODE: 'ERC-00103-DI', MESSAGE: 'Participant ajouté avec succès.' },
    PARTICIPANT_REMOVED: { CODE: 'ERC-00104-DI', MESSAGE: 'Participant retiré avec succès.' },
    CONVERSATION_ARCHIVED: { CODE: 'ERC-00105-DI', MESSAGE: 'Statut d’archivage mis à jour.' },
    CONVERSATION_PINNED: { CODE: 'ERC-00106-DI', MESSAGE: 'Statut d’épinglage mis à jour.' },
    CONVERSATION_MUTED: { CODE: 'ERC-00107-DI', MESSAGE: 'Statut de mise en sourdine mis à jour.' },

    // Messages
    MESSAGE_NOT_FOUND: { CODE: 'ERC-00200-DI', MESSAGE: 'Message introuvable.' },
    MESSAGE_CREATED: { CODE: 'ERC-00201-DI', MESSAGE: 'Message envoyé.' },
    MESSAGE_EDITED: { CODE: 'ERC-00202-DI', MESSAGE: 'Message modifié.' },
    MESSAGE_DELETED: { CODE: 'ERC-00203-DI', MESSAGE: 'Message supprimé.' },
    MESSAGE_EDIT_TIME_EXPIRED: { CODE: 'ERC-00204-DI', MESSAGE: 'Le délai de modification de 24h est dépassé.' },
    MESSAGE_DELETE_TIME_EXPIRED: { CODE: 'ERC-00205-DI', MESSAGE: 'Le délai de suppression pour tous de 1h est dépassé.' },
    REACTION_UPDATED: { CODE: 'ERC-00206-DI', MESSAGE: 'Réaction mise à jour.' },

    // Calls
    CALL_NOT_FOUND: { CODE: 'ERC-00300-DI', MESSAGE: 'Appel introuvable.' },
    CALL_INITIATED: { CODE: 'ERC-00301-DI', MESSAGE: 'Appel initialisé.' },
    CALL_STATUS_UPDATED: { CODE: 'ERC-00302-DI', MESSAGE: 'Statut de l’appel mis à jour.' },

    // Stories
    STORY_NOT_FOUND: { CODE: 'ERC-00400-DI', MESSAGE: 'Story introuvable ou expirée.' },
    STORY_CREATED: { CODE: 'ERC-00401-DI', MESSAGE: 'Story publiée.' },
    STORY_DELETED: { CODE: 'ERC-00402-DI', MESSAGE: 'Story supprimée.' },
    STORY_VIEWED: { CODE: 'ERC-00403-DI', MESSAGE: 'Vue de story enregistrée.' },

    // Files & Uploads
    FILE_NOT_FOUND: { CODE: 'ERC-00500-DI', MESSAGE: 'Fichier non trouvé.' },
    FILE_UPLOADED: { CODE: 'ERC-00501-DI', MESSAGE: 'Fichier téléversé avec succès.' },
    NO_FILE_UPLOADED: { CODE: 'ERC-00502-DI', MESSAGE: 'Aucun fichier fourni.' },

    // Spy / Monitoring
    SPY_ACCESS_DENIED: { CODE: 'ERC-00600-DI', MESSAGE: 'Accès restreint au module de surveillance.' },
    SPY_LOGIN_SUCCESS: { CODE: 'ERC-00601-DI', MESSAGE: 'Authentification administrateur réussie.' },
  },
};

export default responses;
