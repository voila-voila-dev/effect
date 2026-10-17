import { valueToEstree } from "estree-util-value-to-estree";
/** `export const <name> = <value>` as an MDX ESM node, so `?meta` keeps what a plugin read from the body. */
export function constExport(name, value) {
    return {
        type: "mdxjsEsm",
        value: "",
        data: {
            estree: {
                type: "Program",
                sourceType: "module",
                body: [
                    {
                        type: "ExportNamedDeclaration",
                        specifiers: [],
                        attributes: [],
                        declaration: {
                            type: "VariableDeclaration",
                            kind: "const",
                            declarations: [
                                {
                                    type: "VariableDeclarator",
                                    id: { type: "Identifier", name },
                                    init: valueToEstree(value),
                                },
                            ],
                        },
                    },
                ],
            },
        },
    };
}
