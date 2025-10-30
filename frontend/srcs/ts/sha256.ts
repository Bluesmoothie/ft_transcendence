
// Todo: change using sha256
export async function hashString(msg: string)
{
	const msgBuf = new TextEncoder().encode(msg);
	const hashBuf = await crypto.subtle.digest('SHA-256', msgBuf);

	const hashArr = Array.from(new Uint8Array(hashBuf));
	const hashHex = hashArr.map(b => ('00' + b.toString(16)).slice(-2)).join('');

	// console.log(`msg buf: ${msgBuf}`);
	// console.log(`hash buf: ${hashBuf}`);
	// console.log(`hash arr: ${hashArr}`);
	// console.log(`hash hex: ${hashHex}`);
	return hashHex.toString();
}

export function strToCol (str: string)
{
	let hash = 0;
	str.split('').forEach(char =>
	{
		hash = char.charCodeAt(0) + ((hash << 5) - hash)
	})
	let color = '#'
	for (let i = 0; i < 3; i++)
	{
		const value = (hash >> (i * 8)) & 0xff
		color += value.toString(16).padStart(2, '0')
	}
	return color
}
