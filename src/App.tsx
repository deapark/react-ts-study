import React from "react";

type User = { id: number; name: string };

type Props = {
  // 부모가 바꾸는 값 (props 변화 → 업데이트 흐름 관찰용)
  query: string;
};

type State = {
  count: number;
  users: User[];
  loading: boolean;
  lastFetchedQuery: string;
};

class LifecycleDemo extends React.Component<Props, State> {
  private timerId: number | null = null;
  private abortController: AbortController | null = null;

  constructor(props: Props) {
    super(props);
    console.log("[constructor] 1) 인스턴스 생성 / state 초기화");

    this.state = {
      count: 0,
      users: [],
      loading: false,
      lastFetchedQuery: "",
    };
  }

  /**
   * 2) 첫 render → 3) DOM 반영 → 4) componentDidMount
   */
  componentDidMount(): void {
    console.log("[componentDidMount] 4) 화면에 '처음' 붙은 직후");
    // 1) 예: 구독 시작(타이머)
    this.timerId = window.setInterval(() => {
      // setState → 업데이트 발생
      this.setState((prev) => ({ count: prev.count + 1 }));
    }, 1000);

    // 2) 예: 초기 데이터 로드(fetch)
    this.fetchUsers(this.props.query);
  }

  /**
   * 업데이트 완료 후 호출됨 (DOM 반영된 다음)
   */
  componentDidUpdate(prevProps: Props, prevState: State): void {
    // 어떤 원인으로 update가 났는지 로그로 확인
    if (prevState.count !== this.state.count) {
      console.log(
        `[componentDidUpdate] count 변경됨: ${prevState.count} → ${this.state.count}`
      );
    }

    // ✅ props가 바뀌었을 때만 fetch (조건 없으면 무한루프 가능)
    if (prevProps.query !== this.props.query) {
      console.log(
        `[componentDidUpdate] props.query 변경됨: "${prevProps.query}" → "${this.props.query}" → 재조회`
      );
      this.fetchUsers(this.props.query);
    }
  }

  /**
   * 컴포넌트가 화면에서 사라질 때: 정리(cleanup)
   */
  componentWillUnmount(): void {
    console.log("[componentWillUnmount] 컴포넌트 제거 직전 → 정리");

    // 타이머 정리
    if (this.timerId !== null) window.clearInterval(this.timerId);

    // 진행 중 fetch 취소
    if (this.abortController) this.abortController.abort();
  }

  /**
   * ✅ render는 "UI 계산"만 (부작용 X)
   */
  render() {
    console.log("[render] UI 계산(부작용 없이!)");

    const { query } = this.props;
    const { count, users, loading, lastFetchedQuery } = this.state;

    return (
      <div style={{ padding: 16, fontFamily: "sans-serif" }}>
        <h2>Class Lifecycle Demo</h2>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div>
            <b>props.query</b>: {query}
          </div>
          <div>
            <b>count(state)</b>: {count} (1초마다 증가)
          </div>
        </div>

        <hr />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={this.onManualInc}>+1 (setState로 업데이트)</button>
          <button onClick={this.onClearUsers}>users 비우기</button>
        </div>

        <p>
          <b>마지막 fetch query</b>: {lastFetchedQuery || "(없음)"}
        </p>

        {loading ? (
          <p>로딩중...</p>
        ) : (
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                {u.id}. {u.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  private onManualInc = () => {
    this.setState((prev) => ({ count: prev.count + 1 }));
  };

  private onClearUsers = () => {
    this.setState({ users: [] });
  };

  /**
   * 가짜 API 호출(네트워크 대신 setTimeout)로 fetch 흉내
   */
  private fetchUsers(query: string) {
    // 이전 요청 취소
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    console.log(`[fetchUsers] 요청 시작: query="${query}"`);

    this.setState({ loading: true });

    // 실제 fetch 대신, 600ms 뒤 결과 반환
    window.setTimeout(() => {
      // abort되었으면 무시
      if (this.abortController?.signal.aborted) {
        console.log("[fetchUsers] 이전 요청이 취소됨(aborted)");
        return;
      }

      const base = query.trim() ? query.trim() : "user";
      const result: User[] = Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        name: `${base}-${i + 1}`,
      }));

      console.log(`[fetchUsers] 응답 수신: ${result.length}명`);

      this.setState({
        users: result,
        loading: false,
        lastFetchedQuery: query,
      });
    }, 600);
  }
}

export default function App() {
  const [query, setQuery] = React.useState("alpha");
  const [show, setShow] = React.useState(true);

  return (
    <div style={{ padding: 16 }}>
      <h1>Lifecycle Playground</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setShow((s) => !s)}>
          {show ? "컴포넌트 제거(Unmount)" : "컴포넌트 다시 붙이기(Mount)"}
        </button>

        <button onClick={() => setQuery("alpha")}>query=alpha</button>
        <button onClick={() => setQuery("beta")}>query=beta</button>
        <button onClick={() => setQuery("gamma")}>query=gamma</button>
      </div>

      {show ? <LifecycleDemo query={query} /> : <p>(컴포넌트가 제거됨)</p>}
    </div>
  );
}
