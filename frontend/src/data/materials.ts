export const materials = [
    {
        id: "mesh",
        name: "Mesh",
    },
    {
        id: "leather",
        name: "Leather",
    },
    {
        id: "suede",
        name: "Suede",
    },
    {
        id: "knit",
        name: "Knit",
    },
    {
        id: "rubber",
        name: "Rubber",
    },
] as const;

export type SneakerMaterial =
    (typeof materials)[number]["id"];