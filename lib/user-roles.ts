export enum UserRole {
    CENADI_DIRECTOR = "CENADI_DIRECTOR",
    DIVISION_DIRECTOR = "DIVISION_DIRECTOR",
    DIVISION_SECRETARY = "DIVISION_SECRETARY",
}

export enum Division {
    DEP = "DEP",
    DEL = "DEL",
    DTB = "DTB",
    DIRE = "DIRE",
    DAAF = "DAAF",
}

export const DivisionNames: Record<Division, string> = {
    [Division.DEP]: "Division des Études et Projets",
    [Division.DEL]: "Division de l’Exploitation et des Logiciels",
    [Division.DTB]: "Division de la Téléinformatique et de la Bureautique",
    [Division.DIRE]: "Division de l’Informatique appliquée à la Recherche et à l’Enseignement",
    [Division.DAAF]: "Division des Affaires Administratives et Financières",
};

export interface UserSession {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    division?: Division;
}
