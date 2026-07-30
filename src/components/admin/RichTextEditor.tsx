"use client";

import { Extension } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	ChevronDown,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Highlighter,
	Italic,
	MoveVertical as LineHeightIcon,
	Link as LinkIcon,
	List,
	ListOrdered,
	Minus,
	Pilcrow,
	Quote,
	Redo,
	Strikethrough,
	Type,
	UnderlineIcon,
	Undo,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Custom FontSize extension
const FontSize = Extension.create({
	name: "fontSize",
	addOptions() {
		return {
			types: ["textStyle"],
		};
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					fontSize: {
						default: null,
						parseHTML: (element) =>
							element.style.fontSize?.replace(/['"]+/g, "") || null,
						renderHTML: (attributes) => {
							if (!attributes.fontSize) return {};
							return { style: `font-size: ${attributes.fontSize}` };
						},
					},
				},
			},
		];
	},
	addCommands() {
		return {
			setFontSize:
				(fontSize: string) =>
				({ chain }) => {
					return chain().setMark("textStyle", { fontSize }).run();
				},
			unsetFontSize:
				() =>
				({ chain }) => {
					return chain()
						.setMark("textStyle", { fontSize: null })
						.removeEmptyTextStyle()
						.run();
				},
		};
	},
});

// Custom LineHeight extension
const LineHeight = Extension.create({
	name: "lineHeight",
	addOptions() {
		return {
			types: ["paragraph", "heading"],
		};
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					lineHeight: {
						default: null,
						parseHTML: (element) => element.style.lineHeight || null,
						renderHTML: (attributes) => {
							if (!attributes.lineHeight) return {};
							return { style: `line-height: ${attributes.lineHeight}` };
						},
					},
				},
			},
		];
	},
	addCommands() {
		return {
			setLineHeight:
				(lineHeight: string) =>
				({ commands }) => {
					return this.options.types.every((type: string) =>
						commands.updateAttributes(type, { lineHeight }),
					);
				},
			unsetLineHeight:
				() =>
				({ commands }) => {
					return this.options.types.every((type: string) =>
						commands.resetAttributes(type, "lineHeight"),
					);
				},
		};
	},
});

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fontSize: {
			setFontSize: (size: string) => ReturnType;
			unsetFontSize: () => ReturnType;
		};
		lineHeight: {
			setLineHeight: (height: string) => ReturnType;
			unsetLineHeight: () => ReturnType;
		};
	}
}

// Extension to map Enter key to single line break (setHardBreak) like Shift+Enter
const EnterAsHardBreak = Extension.create({
	name: "enterAsHardBreak",
	addKeyboardShortcuts() {
		return {
			Enter: () => {
				// Allow standard list item behavior when inside bullet or ordered lists
				if (
					this.editor.isActive("bulletList") ||
					this.editor.isActive("orderedList")
				) {
					return false;
				}
				return this.editor.commands.setHardBreak();
			},
		};
	},
});

interface RichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
}

export default function RichTextEditor({
	value,
	onChange,
	placeholder: _placeholder,
}: RichTextEditorProps) {
	const [linkUrl, setLinkUrl] = useState("");
	const [showLinkInput, setShowLinkInput] = useState(false);
	const [textColor, setTextColor] = useState("#000000");
	const [highlightColor, setHighlightColor] = useState("#fef08a");
	const [showLineHeightMenu, setShowLineHeightMenu] = useState(false);
	const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
	const isInternalUpdate = useRef(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			EnterAsHardBreak,
			Underline,
			TextStyle,
			FontSize.configure({
				types: ["textStyle"],
			}),
			LineHeight.configure({
				types: ["paragraph", "heading", "textStyle"],
			}),
			Color,
			Highlight.configure({ multicolor: true }),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-amber-600 underline hover:text-amber-700 cursor-pointer",
				},
			}),
		],
		content: value || "",
		editorProps: {
			attributes: {
				class:
					"prose prose-slate max-w-none min-h-[300px] px-4 py-3 focus:outline-none text-sm leading-relaxed",
			},
		},
		onUpdate: ({ editor: ed }) => {
			isInternalUpdate.current = true;
			const html = ed.getHTML();
			onChange(html === "<p></p>" ? "" : html);
		},
	});

	// Sync external value changes (e.g. on initial load)
	useEffect(() => {
		if (editor && !isInternalUpdate.current) {
			const currentContent = editor.getHTML();
			if (value !== currentContent && value !== "") {
				editor.commands.setContent(value, { emitUpdate: false });
			}
		}
		isInternalUpdate.current = false;
	}, [value, editor]);

	const handleAddLink = useCallback(() => {
		if (!editor || !linkUrl.trim()) return;
		const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
		setLinkUrl("");
		setShowLinkInput(false);
	}, [editor, linkUrl]);

	const handleRemoveLink = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().unsetLink().run();
		setShowLinkInput(false);
	}, [editor]);

	const handleColorChange = useCallback(
		(color: string) => {
			setTextColor(color);
			if (editor) {
				editor.chain().focus().setColor(color).run();
			}
		},
		[editor],
	);

	const handleHighlightChange = useCallback(
		(color: string) => {
			setHighlightColor(color);
			if (editor) {
				editor.chain().focus().toggleHighlight({ color }).run();
			}
		},
		[editor],
	);

	const handleSetLineHeight = useCallback(
		(lh: string) => {
			if (!editor) return;
			if (lh === "normal") {
				editor.chain().focus().unsetLineHeight().run();
			} else {
				editor.chain().focus().setLineHeight(lh).run();
			}
			setShowLineHeightMenu(false);
		},
		[editor],
	);

	const handleSetFontSize = useCallback(
		(size: string) => {
			if (!editor) return;
			if (size === "normal") {
				editor.chain().focus().unsetFontSize().run();
			} else {
				editor.chain().focus().setFontSize(size).run();
			}
			setShowFontSizeMenu(false);
		},
		[editor],
	);

	if (!editor) return null;

	const ToolbarButton = ({
		onClick,
		isActive = false,
		children,
		title,
	}: {
		onClick: () => void;
		isActive?: boolean;
		children: React.ReactNode;
		title: string;
	}) => (
		<button
			type="button"
			onMouseDown={(e) => e.preventDefault()}
			onClick={onClick}
			title={title}
			className={`p-1.5 rounded-md transition-colors duration-150 ${
				isActive
					? "bg-amber-100 text-amber-800 shadow-xs"
					: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
			}`}
		>
			{children}
		</button>
	);

	const ToolbarDivider = () => (
		<div className="w-px h-6 bg-slate-200 mx-0.5 shrink-0" />
	);

	const lineSpacings = [
		{ label: "Normal (Default)", value: "normal" },
		{ label: "1.0 (Single)", value: "1.0" },
		{ label: "1.15", value: "1.15" },
		{ label: "1.25", value: "1.25" },
		{ label: "1.5 (Medium)", value: "1.5" },
		{ label: "1.75", value: "1.75" },
		{ label: "2.0 (Double)", value: "2.0" },
		{ label: "2.5", value: "2.5" },
		{ label: "3.0", value: "3.0" },
	];

	const fontSizes = [
		{ label: "Default Size", value: "normal" },
		{ label: "12px", value: "12px" },
		{ label: "14px", value: "14px" },
		{ label: "16px", value: "16px" },
		{ label: "18px", value: "18px" },
		{ label: "20px", value: "20px" },
		{ label: "24px", value: "24px" },
		{ label: "28px", value: "28px" },
		{ label: "32px", value: "32px" },
		{ label: "36px", value: "36px" },
		{ label: "48px", value: "48px" },
	];

	return (
		<div className="mt-1.5 rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400 transition-all shadow-xs">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50/90 select-none">
				{/* Undo / Redo */}
				<ToolbarButton
					onClick={() => editor.chain().focus().undo().run()}
					title="Undo"
				>
					<Undo className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().redo().run()}
					title="Redo"
				>
					<Redo className="h-4 w-4" />
				</ToolbarButton>

				<ToolbarDivider />

				{/* Text format */}
				<ToolbarButton
					onClick={() => editor.chain().focus().setParagraph().run()}
					isActive={editor.isActive("paragraph")}
					title="Paragraph"
				>
					<Pilcrow className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					isActive={editor.isActive("heading", { level: 1 })}
					title="Heading 1"
				>
					<Heading1 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					isActive={editor.isActive("heading", { level: 2 })}
					title="Heading 2"
				>
					<Heading2 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
					isActive={editor.isActive("heading", { level: 3 })}
					title="Heading 3"
				>
					<Heading3 className="h-4 w-4" />
				</ToolbarButton>

				<ToolbarDivider />

				{/* Line Spacing Control */}
				<div className="relative">
					<button
						type="button"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => {
							setShowLineHeightMenu(!showLineHeightMenu);
							setShowFontSizeMenu(false);
						}}
						title="Line Spacing (Line Height)"
						className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
					>
						<LineHeightIcon className="h-4 w-4 text-amber-600" />
						<span>Spacing</span>
						<ChevronDown className="h-3 w-3 text-slate-400" />
					</button>

					{showLineHeightMenu && (
						<div className="absolute left-0 top-full mt-1 z-30 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg divide-y divide-slate-100">
							<div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
								Line Spacing
							</div>
							<div className="py-1">
								{lineSpacings.map((ls) => (
									<button
										key={ls.value}
										type="button"
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => handleSetLineHeight(ls.value)}
										className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between"
									>
										<span>{ls.label}</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Font Size Control */}
				<div className="relative">
					<button
						type="button"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => {
							setShowFontSizeMenu(!showFontSizeMenu);
							setShowLineHeightMenu(false);
						}}
						title="Font Size"
						className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
					>
						<span>Font Size</span>
						<ChevronDown className="h-3 w-3 text-slate-400" />
					</button>

					{showFontSizeMenu && (
						<div className="absolute left-0 top-full mt-1 z-30 w-36 rounded-md border border-slate-200 bg-white py-1 shadow-lg max-h-48 overflow-y-auto">
							<div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
								Font Size
							</div>
							{fontSizes.map((fs) => (
								<button
									key={fs.value}
									type="button"
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => handleSetFontSize(fs.value)}
									className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
								>
									{fs.label}
								</button>
							))}
						</div>
					)}
				</div>

				<ToolbarDivider />

				{/* Inline styles */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					isActive={editor.isActive("bold")}
					title="Bold"
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					isActive={editor.isActive("italic")}
					title="Italic"
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					isActive={editor.isActive("underline")}
					title="Underline"
				>
					<UnderlineIcon className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleStrike().run()}
					isActive={editor.isActive("strike")}
					title="Strikethrough"
				>
					<Strikethrough className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleCode().run()}
					isActive={editor.isActive("code")}
					title="Inline Code"
				>
					<Code className="h-4 w-4" />
				</ToolbarButton>

				<ToolbarDivider />

				{/* Text Color Picker */}
				<div className="relative flex items-center" title="Text Color">
					<label
						onMouseDown={(e) => e.preventDefault()}
						className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors relative flex flex-col items-center justify-center"
					>
						<Type className="h-4 w-4" />
						<div
							className="h-1 w-4 rounded-full mt-0.5"
							style={{ backgroundColor: textColor }}
						/>
						<input
							type="color"
							value={textColor}
							onChange={(e) => handleColorChange(e.target.value)}
							className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
						/>
					</label>
				</div>

				{/* Highlight / Background Color Picker */}
				<div
					className="relative flex items-center"
					title="Text Highlight Color"
				>
					<label
						onMouseDown={(e) => e.preventDefault()}
						className={`p-1.5 rounded-md transition-colors relative flex flex-col items-center justify-center cursor-pointer ${
							editor.isActive("highlight")
								? "bg-amber-100 text-amber-800"
								: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
						}`}
					>
						<Highlighter className="h-4 w-4" />
						<div
							className="h-1 w-4 rounded-full mt-0.5"
							style={{ backgroundColor: highlightColor }}
						/>
						<input
							type="color"
							value={highlightColor}
							onChange={(e) => handleHighlightChange(e.target.value)}
							className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
						/>
					</label>
				</div>

				<ToolbarDivider />

				{/* Alignment */}
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign("left").run()}
					isActive={editor.isActive({ textAlign: "left" })}
					title="Align Left"
				>
					<AlignLeft className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign("center").run()}
					isActive={editor.isActive({ textAlign: "center" })}
					title="Align Center"
				>
					<AlignCenter className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign("right").run()}
					isActive={editor.isActive({ textAlign: "right" })}
					title="Align Right"
				>
					<AlignRight className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign("justify").run()}
					isActive={editor.isActive({ textAlign: "justify" })}
					title="Justify"
				>
					<AlignJustify className="h-4 w-4" />
				</ToolbarButton>

				<ToolbarDivider />

				{/* Lists */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					isActive={editor.isActive("bulletList")}
					title="Bullet List"
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					isActive={editor.isActive("orderedList")}
					title="Ordered List"
				>
					<ListOrdered className="h-4 w-4" />
				</ToolbarButton>

				<ToolbarDivider />

				{/* Blockquote / HR */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					isActive={editor.isActive("blockquote")}
					title="Blockquote"
				>
					<Quote className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
					title="Horizontal Rule"
				>
					<Minus className="h-4 w-4" />
				</ToolbarButton>

				<ToolbarDivider />

				{/* Link */}
				<ToolbarButton
					onClick={() => setShowLinkInput(!showLinkInput)}
					isActive={editor.isActive("link")}
					title="Insert Link"
				>
					<LinkIcon className="h-4 w-4" />
				</ToolbarButton>
			</div>

			{/* Link input bar */}
			{showLinkInput && (
				<div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50">
					<input
						type="url"
						value={linkUrl}
						onChange={(e) => setLinkUrl(e.target.value)}
						placeholder="https://example.com"
						className="flex-1 text-sm px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-400"
						onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
					/>
					<button
						type="button"
						onClick={handleAddLink}
						className="text-xs font-medium px-3 py-1.5 rounded-md bg-amber-500 text-slate-950 hover:bg-amber-600 transition-colors"
					>
						Apply
					</button>
					{editor.isActive("link") && (
						<button
							type="button"
							onClick={handleRemoveLink}
							className="text-xs font-medium px-3 py-1.5 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
						>
							Remove
						</button>
					)}
				</div>
			)}

			{/* Editor content area */}
			<div className="bg-white">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
