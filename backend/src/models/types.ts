export interface Feed {
    id: number;
    guid: string;
    title: string;
    url: string;
    image: string;
    description: string;
    content: string;
    date: Date;
    categories: string[];
}
