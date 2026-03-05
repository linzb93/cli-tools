export interface AwesomeItem {
  title: string;
  description: string;
  url: string;
  tag: string;
}

export interface SearchParams {
  keyword?: string;
  tag?: string;
  type?: 'untagged';
}

export interface TagEditParams {
  tags: { from: string; to: string }[];
}
