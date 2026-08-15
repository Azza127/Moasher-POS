export interface User {
    id: number;
    username: string;
    password: string;
    name: string;
    role: 'Owner' | 'Manager' | 'Employee';
    status: 'Active' | 'Inactive';
}