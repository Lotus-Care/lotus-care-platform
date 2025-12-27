// Partner Types
export interface PartnerLogo {
  id: number;
  name: string;
  width: number;
  height: number;
  formats: {
    small: {
      ext: string;
      url: string;
      hash: string;
      mime: string;
      name: string;
      path: string | null;
      size: number;
      width: number;
      height: number;
      sizeInBytes: number;
    };
    thumbnail: {
      ext: string;
      url: string;
      hash: string;
      mime: string;
      name: string;
      path: string | null;
      size: number;
      width: number;
      height: number;
      sizeInBytes: number;
    };
  };
  url: string;
}

export interface PartnerData {
  id: number;
  nome: string;
  slug: string;
  logo: PartnerLogo;
}

export interface PartnerInfo {
  name: string;
  logo: string | null;
  slug: string;
}

export interface StrapiPartnerResponse {
  data: PartnerData | null;
  error?: {
    status: number;
    message: string;
  };
}

