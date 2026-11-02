"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "wanwu-prototype-machine-license-v1";
const DAY = 86400000;
const formatTime = (time: number) => new Date(time).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Remains available for this visit if browser storage is disabled. */ } };

/** Prototype data only. Production status and activation must use the platform license APIs. */
export function MachineLicense() {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const machineCode = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const stored = Number(read(STORAGE_KEY));
      // A stored zero represents a deployment awaiting its first activation.
      const expiry = read(STORAGE_KEY) === "0" ? 0 : stored > 0 && Number.isFinite(stored) ? stored : Date.now() + 7 * DAY;
      write(STORAGE_KEY, String(expiry));
      setExpiresAt(expiry);
      setNow(Date.now());
    }, 0);
    const refresh = () => { setNow(Date.now()); };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearTimeout(initialize); window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const unlicensed = expiresAt === 0;
  const remaining = expiresAt === null || unlicensed ? null : expiresAt - now;
  const expired = remaining !== null && remaining <= 0;
  const warning = remaining !== null && remaining <= 30 * DAY;
  const reminder = unlicensed ? "机器尚未授权" : expired ? "机器授权已过期" : <>机器授权将在 <strong>{Math.max(1, Math.ceil((remaining ?? 0) / DAY))}</strong> 天后过期</>;
  const showReminder = (warning || unlicensed) && !dismissed;

  const openDetails = () => { setFeedback(""); setCode(""); setOpen(true); };
  // Prototype only: hide until reload. Daily dismissal persistence belongs to production.
  const dismissReminder = () => { setDismissed(true); };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText("2682e3205"); setFeedback("机器码已复制"); }
    catch { machineCode.current?.focus(); machineCode.current?.select(); setFeedback("请复制已选中的机器码"); }
  };

  return <>
    <div className={`machine-license-tools${showReminder ? " with-reminder" : ""}${expired ? " expired" : ""}`}>
      <button className={`machine-license-icon${warning || unlicensed ? " has-warning" : ""}`} onClick={openDetails} aria-label="机器授权" title="机器授权" aria-haspopup="dialog"><ShieldCheck size={13} />{(warning || unlicensed) && !showReminder && <span className="machine-license-dot" />}</button>
      {showReminder && <div className="machine-license-reminder" role="status">
        <button className="machine-license-reminder-link" onClick={openDetails} title={expiresAt ? `到期时间：${formatTime(expiresAt)}（北京时间），点击更新授权` : undefined}><span>{reminder}</span></button>
        <button className="machine-license-dismiss" onClick={dismissReminder} aria-label="今日不再提醒授权到期" aria-describedby="machine-license-dismiss-tooltip"><X size={11} /><span className="machine-license-tooltip" id="machine-license-dismiss-tooltip" role="tooltip">今日不再提醒</span></button>
      </div>}
    </div>
    <dialog ref={dialog} className="machine-license-dialog" aria-labelledby="machine-license-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <div className="machine-license-dialog-head"><div><h2 id="machine-license-title">机器授权</h2><p>复制机器码获取授权码，粘贴后完成授权。</p></div><button className="machine-license-close" aria-label="关闭机器授权" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <div className={`machine-license-summary${unlicensed || warning ? " needs-attention" : ""}`}>
        <ShieldCheck size={18} aria-hidden="true" />
        <div>{(!warning || expired) && <span>{expiresAt === null ? "正在读取授权信息" : unlicensed ? "未授权" : expired ? "授权已过期" : "授权有效"}</span>}<p>{expiresAt === null ? "请稍候" : unlicensed ? "完成首次授权后即可使用平台。" : `到期时间：${formatTime(expiresAt)}（北京时间）`}</p></div>
      </div>
      <form id="machine-license-update" className="machine-license-form" onSubmit={event => {
        event.preventDefault();
        if (expiresAt === null) return;
        if (code.trim() !== "DEMO-RENEW-365") { setFeedback("请输入演示授权码 DEMO-RENEW-365；真实授权码请在正式平台使用。"); return; }
        const nextExpiry = Date.now() + 365 * DAY;
        write(STORAGE_KEY, String(nextExpiry));
        setExpiresAt(nextExpiry); setNow(Date.now()); setCode(""); setFeedback(unlicensed ? "演示授权已激活。" : "演示授权已更新，到期提醒已清除。");
      }}>
        <div><label className="machine-license-label" htmlFor="machine-license-code">机器码</label><div className="machine-license-code"><input ref={machineCode} id="machine-license-code" value="2682e3205" readOnly /><button type="button" onClick={copyCode}><Copy size={14} />复制机器码</button></div><p className="machine-license-help">将本机机器码提供给供应商，获取对应授权码。</p></div>
        <div><label className="machine-license-label" htmlFor="machine-license-new-code">授权码</label><textarea id="machine-license-new-code" value={code} onChange={event => { setCode(event.target.value); setFeedback(""); }} rows={5} placeholder="请粘贴供应商提供的授权码" required /></div>
      </form>
      <p className="machine-license-feedback" role="status">{feedback}</p>
      <div className="machine-license-dialog-footer"><button onClick={() => setOpen(false)}>取消</button><button className="primary" type="submit" form="machine-license-update" disabled={!code.trim() || expiresAt === null}>{unlicensed ? "激活授权" : "更新授权"}</button></div>
    </dialog>
  </>;
}
