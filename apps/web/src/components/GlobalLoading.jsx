import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

let pendingRequests = 0;
const listeners = new Set();

export function beginRequest() {
    pendingRequests += 1;
    listeners.forEach((listener) => listener(pendingRequests));
}

export function endRequest() {
    pendingRequests = Math.max(0, pendingRequests - 1);
    listeners.forEach((listener) => listener(pendingRequests));
}

export function GlobalLoading() {
    const [httpPending, setHttpPending] = useState(pendingRequests);
    const fetching = useIsFetching();
    const mutating = useIsMutating();

    useEffect(() => {
        const listener = (count) => setHttpPending(count);
        listeners.add(listener);
        return () => listeners.delete(listener);
    }, []);

    const visible = httpPending > 0 || fetching > 0 || mutating > 0;
    if (!visible) return null;

    return (
        <div className="global-loading" role="status" aria-live="polite" aria-label="Loading">
            <div className="global-loading-card">
                <span className="global-loading-mark">NP</span>
                <div className="global-loading-copy">
                    <strong>Neera Pace</strong>
                    <span>Preparing the academy</span>
                </div>
            </div>
            <span className="global-loading-track"><span /></span>
        </div>
    );
}
