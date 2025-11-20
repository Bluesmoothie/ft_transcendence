export class Utils
{
	constructor(private HTMLelements: Map<string, HTMLElement>, private color: string) {}

	public show(className: string): void
	{
		this.HTMLelements.get(className)!.style.display = 'block';
	}

	public hide(className: string): void
	{
		this.HTMLelements.get(className)!.style.display = 'none';
	}

	public setContent(className: string, content: string): void
	{
		this.HTMLelements.get(className)!.textContent = content;
		this.show(className);
	}

	public setColor(className: string, opacity: string): void
	{
		this.HTMLelements.get(className)!.style.color = `rgba(${this.color}, ${opacity})`;
		this.show(className);
	}

	public setHeight(className: string, height: string): void
	{
		this.HTMLelements.get(className)!.style.height = height;
		this.show(className);
	}

	public setWidth(className: string, width: string): void
	{
		this.HTMLelements.get(className)!.style.width = width;
		this.show(className);
	}

	public setLeft(className: string, left: string): void
	{
		this.HTMLelements.get(className)!.style.left = left;
		this.show(className);
	}

	public setRight(className: string, right: string): void
	{
		this.HTMLelements.get(className)!.style.right = right;
		this.show(className);
	}

	public setTop(className: string, top: string): void
	{
		this.HTMLelements.get(className)!.style.top = top;
		this.show(className);
	}

	public setBottom(className: string, bottom: string): void
	{
		this.HTMLelements.get(className)!.style.bottom = bottom;
		this.show(className);
	}

	public setInnerHTML(className: string, html: string): void
	{
		this.HTMLelements.get(className)!.innerHTML = html;
		this.show(className);
	}
}
