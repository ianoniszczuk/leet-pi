// Auth0 Types
export interface Auth0User {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
    [key: string]: any;
}

// Component Props Types
export interface ProtectedRouteProps {
    children: React.ReactNode;
}

export interface AuthButtonProps {
    className?: string;
}
