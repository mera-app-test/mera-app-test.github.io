/**
 * Granice slojeva Mere (ARCHITECTURE.md §6.1). Kršenje = neuspešan CI build.
 * Dozvoljeni smerovi:
 *   domain      → domain, schemas
 *   validation  → validation, domain, schemas
 *   safety      → safety, domain, schemas
 *   schemas     → schemas
 *   backup      → backup, domain, schemas
 *   ports       → ports, domain, schemas
 *   application → application, domain, validation, safety, schemas, ports, backup
 *   ai          → ai, application, schemas, ports
 *   infrastructure → infrastructure, ports, schemas, domain
 *   ui          → ui, application, schemas
 *   composition → sve
 */
const layer = (name) => `^src/${name}/`;
const onlyAllowed = (from, allowed) => ({
  name: `${from}-granica`,
  comment: `${from} sme da uvozi samo: ${allowed.join(", ")}`,
  severity: "error",
  from: { path: layer(from) },
  to: {
    path: "^src/",
    pathNot: allowed.map(layer).concat(["^src/env\\.d\\.ts$"]),
  },
});

module.exports = {
  forbidden: [
    onlyAllowed("domain", ["domain", "schemas"]),
    onlyAllowed("validation", ["validation", "domain", "schemas"]),
    onlyAllowed("safety", ["safety", "domain", "schemas"]),
    onlyAllowed("schemas", ["schemas"]),
    onlyAllowed("backup", ["backup", "domain", "schemas"]),
    onlyAllowed("ports", ["ports", "domain", "schemas"]),
    onlyAllowed("application", ["application", "domain", "validation", "safety", "schemas", "ports", "backup"]),
    onlyAllowed("ai", ["ai", "application", "schemas", "ports"]),
    onlyAllowed("infrastructure", ["infrastructure", "ports", "schemas", "domain"]),
    onlyAllowed("ui", ["ui", "application", "schemas"]),
    {
      name: "react-samo-u-ui",
      comment: "React sme da se koristi samo u ui/ i composition/",
      severity: "error",
      from: { pathNot: ["^src/ui/", "^src/composition/"] },
      to: { path: "node_modules/(react|react-dom)/" },
    },
    {
      name: "bez-kruznih-zavisnosti",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "nepostojeci-modul",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default", "types"] },
  },
};
