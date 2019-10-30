// 复制到剪切板
export const execCommandCopy = (text) => {
    // add by lynn
    // 一个神奇的方法 拯救了IE11 和 丢失格式问题
    var target = document.createElement("textarea");
    target.style.position = "absolute";
    target.style.left = "-9999px";
    target.style.top = "0";
    target.id = 'textareaCopy';
    document.body.appendChild(target);
    target.textContent = text;
    target.focus();
    target.setSelectionRange(0, target.value.length);
    document.execCommand("copy");
    document.body.removeChild(target)
}