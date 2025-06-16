export interface CategoryAttribute {
  id?: number;  // optional
  name: string;
  dataType: string;
  options?: string[];  // Array of predefined options for this attribute
}


export interface category{
    id:number;
    name:string;
    created_at?:string;
    admin_id?:number;
    parent_category_id?:number;
    attributes?: CategoryAttribute[];
    image_url?:string;

}