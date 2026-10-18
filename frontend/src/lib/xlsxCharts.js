// Adds native (editable) Excel charts to an .xlsx produced by ExcelJS, which cannot write charts itself.
// Each chart becomes xl/charts/chartN.xml, linked from a drawing attached to its worksheet.
import JSZip from 'jszip'

const NS_C = 'http://schemas.openxmlformats.org/drawingml/2006/chart'
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const REL_CHART = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart'
const REL_DRAWING = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const hex = (c) => c.replace('#', '').toUpperCase()

const fill = (color) => `<a:solidFill><a:srgbClr val="${hex(color)}"/></a:solidFill>`
const textProps = (size = 900, color = '52514E', bold = false) =>
    `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${size}" b="${bold ? 1 : 0}">${fill(color)}<a:latin typeface="Calibri"/></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>`

const strCache = (values) =>
    `<c:strCache><c:ptCount val="${values.length}"/>${values.map((v, i) => `<c:pt idx="${i}"><c:v>${esc(v)}</c:v></c:pt>`).join('')}</c:strCache>`
const numCache = (values, format) =>
    `<c:numCache><c:formatCode>${esc(format)}</c:formatCode><c:ptCount val="${values.length}"/>${values.map((v, i) => `<c:pt idx="${i}"><c:v>${Number(v) || 0}</c:v></c:pt>`).join('')}</c:numCache>`

const cat = (chart) => `<c:cat><c:strRef><c:f>${esc(chart.categoryRef)}</c:f>${strCache(chart.categories)}</c:strRef></c:cat>`
const val = (series, format) => `<c:val><c:numRef><c:f>${esc(series.ref)}</c:f>${numCache(series.values, format)}</c:numRef></c:val>`
const serTx = (series) => series.nameRef
    ? `<c:tx><c:strRef><c:f>${esc(series.nameRef)}</c:f>${strCache([series.name])}</c:strRef></c:tx>`
    : `<c:tx><c:v>${esc(series.name)}</c:v></c:tx>`

const title = (text) =>
    `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1300" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1300" b="1">${fill('14232B')}<a:latin typeface="Calibri"/></a:rPr><a:t>${esc(text)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>`

const legend = (pos) => `<c:legend><c:legendPos val="${pos}"/><c:overlay val="0"/>${textProps(900)}</c:legend>`

const pieXml = (chart) => {
    const series = chart.series[0]
    const points = chart.pointColors.map((color, i) =>
        `<c:dPt><c:idx val="${i}"/><c:bubble3D val="0"/><c:spPr>${fill(color)}<a:ln w="19050">${fill('FFFFFF')}</a:ln></c:spPr></c:dPt>`).join('')
    const labels = `<c:dLbls><c:numFmt formatCode="0%" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${textProps(900, '14232B', true)}<c:dLblPos val="${chart.type === 'doughnut' ? 'ctr' : 'bestFit'}"/><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="1"/><c:showBubbleSize val="0"/><c:showLeaderLines val="1"/></c:dLbls>`
    // Doughnut labels cannot use dLblPos; drop it there.
    const dLbls = chart.type === 'doughnut' ? labels.replace(/<c:dLblPos val="ctr"\/>/, '') : labels
    const ser = `<c:ser><c:idx val="0"/><c:order val="0"/>${serTx(series)}${points}${dLbls}${cat(chart)}${val(series, chart.numFormat)}</c:ser>`
    return chart.type === 'doughnut'
        ? `<c:doughnutChart><c:varyColors val="1"/>${ser}<c:firstSliceAng val="0"/><c:holeSize val="58"/></c:doughnutChart>`
        : `<c:pieChart><c:varyColors val="1"/>${ser}<c:firstSliceAng val="0"/></c:pieChart>`
}

const barXml = (chart) => {
    const sers = chart.series.map((s, i) =>
        `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${serTx(s)}<c:spPr>${fill(s.color)}</c:spPr><c:invertIfNegative val="0"/>${cat(chart)}${val(s, chart.numFormat)}</c:ser>`).join('')
    const axisLine = `<c:spPr><a:ln w="9525">${fill('C3C9C6')}</a:ln></c:spPr>`
    return `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${sers}<c:gapWidth val="70"/><c:overlap val="-8"/><c:axId val="5001"/><c:axId val="5002"/></c:barChart>`
        + `<c:catAx><c:axId val="5001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="low"/>${axisLine}${textProps(800)}<c:crossAx val="5002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>`
        + `<c:valAx><c:axId val="5002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln w="6350">${fill('E4E8E6')}</a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="${esc(chart.axisFormat || chart.numFormat)}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${textProps(800)}<c:crossAx val="5001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>`
}

export const chartXml = (chart) => {
    const isPie = chart.type === 'pie' || chart.type === 'doughnut'
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
        + `<c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><c:roundedCorners val="0"/>`
        + `<c:chart>${title(chart.title)}<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>${isPie ? pieXml(chart) : barXml(chart)}<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea>`
        + `${legend(isPie ? 'r' : 't')}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>`
        + `<c:spPr>${fill('FFFFFF')}<a:ln w="9525">${fill('DDE3E0')}</a:ln></c:spPr>${textProps(900)}</c:chartSpace>`
}

const anchorXml = ({from, to}, index) =>
    `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${from.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${from.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>`
    + `<xdr:to><xdr:col>${to.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${to.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>`
    + `<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${index + 2}" name="Chart ${index + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>`
    + `<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${NS_C}"><c:chart xmlns:c="${NS_C}" xmlns:r="${NS_R}" r:id="rId${index + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`

const relsXml = (rels) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.map((r) => `<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`).join('')}</Relationships>`

// Maps sheet names to their part paths via workbook.xml and its rels.
const sheetPaths = async (zip) => {
    const workbook = await zip.file('xl/workbook.xml').async('string')
    const rels = await zip.file('xl/_rels/workbook.xml.rels').async('string')
    const targets = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map(([tag]) => [
        tag.match(/Id="([^"]+)"/)[1], tag.match(/Target="([^"]+)"/)[1],
    ]))
    const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    return new Map([...workbook.matchAll(/<sheet\b[^>]*>/g)].map(([tag]) => {
        const name = decode(tag.match(/name="([^"]+)"/)[1])
        const target = targets.get(tag.match(/r:id="([^"]+)"/)[1]).replace(/^\/?xl\//, '')
        return [name, `xl/${target}`]
    }))
}

/**
 * charts: [{sheet, type: 'pie'|'doughnut'|'bar', title, anchor: {from: {col,row}, to: {col,row}} (0-based),
 *           categoryRef, categories, series: [{name, nameRef?, ref, values, color?}], pointColors?, numFormat}]
 */
export async function addCharts(buffer, charts) {
    const zip = await JSZip.loadAsync(buffer)
    const paths = await sheetPaths(zip)
    let types = await zip.file('[Content_Types].xml').async('string')

    const bySheet = new Map()
    charts.forEach((chart) => bySheet.set(chart.sheet, [...(bySheet.get(chart.sheet) || []), chart]))

    let chartNo = 0
    let drawingNo = 0
    for(const [sheet, sheetCharts] of bySheet){
        const sheetPath = paths.get(sheet)
        if(!sheetPath) throw new Error(`Sheet not found: ${sheet}`)
        drawingNo += 1
        const drawingRels = []
        const anchors = sheetCharts.map((chart, i) => {
            chartNo += 1
            zip.file(`xl/charts/chart${chartNo}.xml`, chartXml(chart))
            types = types.replace('</Types>', `<Override PartName="/xl/charts/chart${chartNo}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>`)
            drawingRels.push({id: `rId${i + 1}`, type: REL_CHART, target: `../charts/chart${chartNo}.xml`})
            return anchorXml(chart.anchor, i)
        })
        zip.file(`xl/drawings/drawing${drawingNo}.xml`,
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="${NS_A}">${anchors.join('')}</xdr:wsDr>`)
        zip.file(`xl/drawings/_rels/drawing${drawingNo}.xml.rels`, relsXml(drawingRels))
        types = types.replace('</Types>', `<Override PartName="/xl/drawings/drawing${drawingNo}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`)

        // Link the drawing from the worksheet, keeping any relationships ExcelJS already wrote.
        const dir = sheetPath.slice(0, sheetPath.lastIndexOf('/'))
        const file = sheetPath.slice(sheetPath.lastIndexOf('/') + 1)
        const relsPath = `${dir}/_rels/${file}.rels`
        const existing = zip.file(relsPath) ? await zip.file(relsPath).async('string') : null
        const relId = 'rIdChartDrawing1'
        const rel = `<Relationship Id="${relId}" Type="${REL_DRAWING}" Target="../drawings/drawing${drawingNo}.xml"/>`
        zip.file(relsPath, existing ? existing.replace('</Relationships>', `${rel}</Relationships>`) : relsXml([{id: relId, type: REL_DRAWING, target: `../drawings/drawing${drawingNo}.xml`}]))

        let xml = await zip.file(sheetPath).async('string')
        if(!/xmlns:r=/.test(xml.match(/<worksheet\b[^>]*>/)[0])){
            xml = xml.replace('<worksheet', `<worksheet xmlns:r="${NS_R}"`)
        }
        // <drawing> must come before legacyDrawing / tableParts / extLst in the schema order.
        const tag = `<drawing r:id="${relId}"/>`
        const before = ['<legacyDrawing', '<legacyDrawingHF', '<picture', '<oleObjects', '<controls', '<webPublishItems', '<tableParts', '<extLst', '</worksheet>']
            .map((t) => xml.indexOf(t)).filter((i) => i >= 0)
        const at = Math.min(...before)
        xml = xml.slice(0, at) + tag + xml.slice(at)
        zip.file(sheetPath, xml)
    }

    zip.file('[Content_Types].xml', types)
    return zip.generateAsync({type: 'uint8array', compression: 'DEFLATE'})
}
