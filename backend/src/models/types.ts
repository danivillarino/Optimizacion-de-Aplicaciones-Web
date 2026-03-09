export interface Feed {
    id: number;
    guid: string;
    title: string;
    url: string;
    description: string;
    content: string;
    date: Date;
    categories: string[];
}
