import type {Cell} from '../../shared/model'
// The shipped neutral/transparent baseline follows the app. Explicit custom
// backgrounds and other text colors retain their portable appearance.
export const cellColors=(cell:Cell)=>({color:cell.style.backgroundColor==='transparent'&&cell.style.textColor.toLowerCase()==='#e4e6e8'?'var(--text)':cell.style.textColor,background:cell.style.backgroundColor})
