import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

/**
 * MarkdownText Component
 * Renders markdown-style text with support for:
 * - **bold** and *italic*
 * - `code` inline
 * - Lists (- item, 1. item)
 * - Headers (# ## ###)
 * - Tables (|col|col|)
 * - Links [text](url) (shown as text only)
 */
export default function MarkdownText({ children, style, isUser = false }) {
    if (!children || typeof children !== 'string') {
        return <Text style={style}>{children}</Text>;
    }

    const baseColor = isUser ? '#fff' : colors.foreground;
    const mutedColor = isUser ? 'rgba(255,255,255,0.7)' : colors.mutedForeground;

    // Split by lines first to handle block-level elements
    const lines = children.split('\n');
    const elements = [];

    let inCodeBlock = false;
    let codeBlockContent = [];
    let tableRows = [];
    let inTable = false;

    lines.forEach((line, lineIndex) => {
        // Handle code blocks (```)
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                // End of code block
                elements.push(
                    <View key={`code-${lineIndex}`} style={styles.codeBlock}>
                        <Text style={styles.codeBlockText}>{codeBlockContent.join('\n')}</Text>
                    </View>
                );
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            return;
        }

        // Handle tables (lines starting with |)
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableRows = [];
            }
            // Skip separator lines (|---|---|)
            if (!line.includes('---')) {
                const cells = line.split('|').filter(c => c.trim() !== '');
                tableRows.push(cells.map(c => c.trim()));
            }
            return;
        } else if (inTable) {
            // End of table
            elements.push(renderTable(tableRows, lineIndex, baseColor));
            tableRows = [];
            inTable = false;
        }

        // Handle headers
        if (line.startsWith('### ')) {
            elements.push(
                <Text key={lineIndex} style={[styles.h3, { color: baseColor }]}>
                    {parseInlineMarkdown(line.slice(4), baseColor)}
                </Text>
            );
            return;
        }
        if (line.startsWith('## ')) {
            elements.push(
                <Text key={lineIndex} style={[styles.h2, { color: baseColor }]}>
                    {parseInlineMarkdown(line.slice(3), baseColor)}
                </Text>
            );
            return;
        }
        if (line.startsWith('# ')) {
            elements.push(
                <Text key={lineIndex} style={[styles.h1, { color: baseColor }]}>
                    {parseInlineMarkdown(line.slice(2), baseColor)}
                </Text>
            );
            return;
        }

        // Handle bullet lists (- or *)
        if (line.match(/^[\s]*[-*]\s/)) {
            const indent = line.match(/^(\s*)/)[1].length;
            const content = line.replace(/^[\s]*[-*]\s/, '');
            elements.push(
                <View key={lineIndex} style={[styles.listItem, { marginLeft: indent * 8 }]}>
                    <Text style={[styles.bullet, { color: baseColor }]}>•</Text>
                    <Text style={[styles.listText, { color: baseColor }]}>
                        {parseInlineMarkdown(content, baseColor)}
                    </Text>
                </View>
            );
            return;
        }

        // Handle numbered lists
        if (line.match(/^[\s]*\d+\.\s/)) {
            const match = line.match(/^(\s*)(\d+)\.\s(.*)/);
            if (match) {
                const indent = match[1].length;
                const number = match[2];
                const content = match[3];
                elements.push(
                    <View key={lineIndex} style={[styles.listItem, { marginLeft: indent * 8 }]}>
                        <Text style={[styles.number, { color: baseColor }]}>{number}.</Text>
                        <Text style={[styles.listText, { color: baseColor }]}>
                            {parseInlineMarkdown(content, baseColor)}
                        </Text>
                    </View>
                );
                return;
            }
        }

        // Regular paragraph
        if (line.trim()) {
            elements.push(
                <Text key={lineIndex} style={[styles.paragraph, { color: baseColor }]}>
                    {parseInlineMarkdown(line, baseColor)}
                </Text>
            );
        } else if (lineIndex > 0 && lineIndex < lines.length - 1) {
            // Empty line = paragraph break
            elements.push(<View key={lineIndex} style={styles.paragraphBreak} />);
        }
    });

    // Handle any remaining table
    if (inTable && tableRows.length > 0) {
        elements.push(renderTable(tableRows, 'final', baseColor));
    }

    return <View style={style}>{elements}</View>;
}

// Render table - pass baseColor for inline markdown parsing
function renderTable(rows, key, baseColor = colors.foreground) {
    if (rows.length === 0) return null;

    const isHeader = rows.length > 1;

    return (
        <View key={`table-${key}`} style={styles.table}>
            {rows.map((row, rowIndex) => (
                <View
                    key={rowIndex}
                    style={[
                        styles.tableRow,
                        rowIndex === 0 && isHeader && styles.tableHeaderRow
                    ]}
                >
                    {row.map((cell, cellIndex) => (
                        <View key={cellIndex} style={styles.tableCell}>
                            <Text style={[
                                styles.tableCellText,
                                rowIndex === 0 && isHeader && styles.tableHeaderText
                            ]}>
                                {parseInlineMarkdown(cell, baseColor)}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

// Parse inline markdown (bold, italic, code, links)
function parseInlineMarkdown(text, baseColor) {
    const parts = [];
    let remaining = text;
    let keyIndex = 0;

    // Patterns to match (in order of priority)
    const patterns = [
        // Bold + Italic (***text***)
        { regex: /\*\*\*(.+?)\*\*\*/g, style: 'boldItalic' },
        // Bold (**text**)
        { regex: /\*\*(.+?)\*\*/g, style: 'bold' },
        // Italic (*text* or _text_)
        { regex: /\*(.+?)\*|_(.+?)_/g, style: 'italic' },
        // Inline code (`code`)
        { regex: /`([^`]+)`/g, style: 'code' },
        // Links [text](url)
        { regex: /\[([^\]]+)\]\([^)]+\)/g, style: 'link' },
    ];

    // Process all patterns
    let matches = [];
    patterns.forEach(({ regex, style }) => {
        let match;
        const re = new RegExp(regex.source, 'g');
        while ((match = re.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                content: match[1] || match[2] || match[0],
                style,
                full: match[0]
            });
        }
    });

    // Sort by start position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches
    const filteredMatches = [];
    let lastEnd = 0;
    matches.forEach(m => {
        if (m.start >= lastEnd) {
            filteredMatches.push(m);
            lastEnd = m.end;
        }
    });

    // Build parts
    let currentIndex = 0;
    filteredMatches.forEach(match => {
        // Add text before match
        if (match.start > currentIndex) {
            parts.push(
                <Text key={keyIndex++} style={{ color: baseColor }}>
                    {text.slice(currentIndex, match.start)}
                </Text>
            );
        }

        // Add styled match
        switch (match.style) {
            case 'boldItalic':
                parts.push(
                    <Text key={keyIndex++} style={[styles.boldItalic, { color: baseColor }]}>
                        {match.content}
                    </Text>
                );
                break;
            case 'bold':
                parts.push(
                    <Text key={keyIndex++} style={[styles.bold, { color: baseColor }]}>
                        {match.content}
                    </Text>
                );
                break;
            case 'italic':
                parts.push(
                    <Text key={keyIndex++} style={[styles.italic, { color: baseColor }]}>
                        {match.content}
                    </Text>
                );
                break;
            case 'code':
                parts.push(
                    <Text key={keyIndex++} style={styles.inlineCode}>
                        {match.content}
                    </Text>
                );
                break;
            case 'link':
                parts.push(
                    <Text key={keyIndex++} style={styles.link}>
                        {match.content}
                    </Text>
                );
                break;
        }

        currentIndex = match.end;
    });

    // Add remaining text
    if (currentIndex < text.length) {
        parts.push(
            <Text key={keyIndex++} style={{ color: baseColor }}>
                {text.slice(currentIndex)}
            </Text>
        );
    }

    return parts.length > 0 ? parts : text;
}

const styles = StyleSheet.create({
    // Headers
    h1: {
        fontSize: 20,
        fontFamily: fonts.heading.bold,
        marginVertical: 8,
    },
    h2: {
        fontSize: 17,
        fontFamily: fonts.heading.bold,
        marginVertical: 6,
    },
    h3: {
        fontSize: 15,
        fontFamily: fonts.sans.bold,
        marginVertical: 4,
    },

    // Paragraph
    paragraph: {
        fontSize: 15,
        fontFamily: fonts.sans.regular,
        lineHeight: 22,
        marginVertical: 2,
    },
    paragraphBreak: {
        height: 8,
    },

    // Inline styles
    bold: {
        fontFamily: fonts.sans.bold,
    },
    italic: {
        fontStyle: 'italic',
    },
    boldItalic: {
        fontFamily: fonts.sans.bold,
        fontStyle: 'italic',
    },
    inlineCode: {
        fontFamily: 'monospace',
        fontSize: 13,
        backgroundColor: `${colors.muted}80`,
        color: colors.chart3,
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    link: {
        color: colors.primary,
        textDecorationLine: 'underline',
    },

    // Lists
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 2,
    },
    bullet: {
        fontSize: 15,
        lineHeight: 22,
        marginRight: 8,
        width: 12,
    },
    number: {
        fontSize: 15,
        fontFamily: fonts.sans.medium,
        lineHeight: 22,
        marginRight: 8,
        width: 20,
    },
    listText: {
        flex: 1,
        fontSize: 15,
        fontFamily: fonts.sans.regular,
        lineHeight: 22,
    },

    // Code block
    codeBlock: {
        backgroundColor: colors.muted,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
    },
    codeBlockText: {
        fontFamily: 'monospace',
        fontSize: 13,
        color: colors.foreground,
        lineHeight: 18,
    },

    // Table
    table: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        overflow: 'hidden',
        marginVertical: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableHeaderRow: {
        backgroundColor: colors.muted,
    },
    tableCell: {
        flex: 1,
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    tableCellText: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
    },
    tableHeaderText: {
        fontFamily: fonts.sans.bold,
    },
});
