export function getIpAddress(request) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteIP = request.ip || null;

  let ipList = [];

  if (xForwardedFor) {
    ipList = xForwardedFor.split(",").map((ip) => ip.trim());
  }

  if (realIP) {
    ipList.push(realIP.trim());
  }

  if (remoteIP) {
    ipList.push(remoteIP.trim());
  }

  // Prefer IPv4 if available
  let selectedIP =
    ipList.find((ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) ||
    ipList[0] ||
    "unknown";

  if (selectedIP.startsWith("[") && selectedIP.includes("]:")) {
    selectedIP = selectedIP.slice(1, selectedIP.indexOf("]"));
  } else if (
    selectedIP.includes(":") &&
    !selectedIP.includes("::") &&
    selectedIP.split(":").length === 2
  ) {
    selectedIP = selectedIP.split(":")[0];
  }

  return selectedIP;
}
