// disable-react-devtools-plugin.js
const disableReactDevToolsPlugin = {
  name: "disable-react-devtools",
  setup(build) {
    // When an import for 'react-devtools-core' is encountered,
    // return an empty module.
    build.onResolve({ filter: /^react-devtools-core$/ }, (args) => {
      return { path: args.path, namespace: "disable-devtools" };
    });
    build.onLoad({ filter: /.*/, namespace: "disable-devtools" }, () => {
      return { contents: "", loader: "js" };
    });
  },
};

module.exports = disableReactDevToolsPlugin;