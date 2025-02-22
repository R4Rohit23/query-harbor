import useGlobalInfiniteQuery from "./hooks/useGlobalInfiniteQuery";
import useGlobalMutation from "./hooks/useGlobalMutation";
import useGlobalQuery from "./hooks/useGlobalQuery";

function App() {
    return { useGlobalQuery, useGlobalMutation, useGlobalInfiniteQuery };
}

export default App;
