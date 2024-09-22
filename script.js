let url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json";
let req = new XMLHttpRequest();

let data;
let dataset;

let xScale;
let yScale;

let width = 800;
let height = 600;
let padding = 40;

let svg = d3.select("svg");

// 時間を秒数に変換する関数
const timeToSeconds = (time) => {
    let [minutes, seconds] = time.split(':').map(Number);
    return (minutes * 60) + seconds;
}

// 秒数を時間に変換する関数
const secondsToTime = (seconds) => {
    let minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

const drawCanvas = () => {
    svg.attr("width", width)
       .attr("height", height);
}

const generateScales = () => {
    // X軸はYear
    xScale = d3.scaleLinear()
               .domain([d3.min(data, (item) => item.Year) - 1, d3.max(data, (item) => item.Year) + 1]) // 年を少し拡張
               .range([padding, width - padding]);

    // Y軸はTime（秒数に変換）
    yScale = d3.scaleLinear()
               .domain([d3.max(data, (item) => timeToSeconds(item.Time)), d3.min(data, (item) => timeToSeconds(item.Time))])
               .range([height - padding, padding]);
}

const generateAxis = () => {
    let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")); // 年は整数で表示
    let yAxis = d3.axisLeft(yScale)
                   .tickFormat(seconds => secondsToTime(seconds)); // 秒数をMM:SS形式にフォーマット

    svg.append("g")
       .call(xAxis)
       .attr("id", "x-axis")
       .attr("transform", `translate(0, ${height - padding})`); // X軸を下に配置

    svg.append("g")
       .call(yAxis)
       .attr("id", "y-axis")
       .attr("transform", `translate(${padding}, 0)`); // Y軸を左に配置
}

const drawScatters = () => {
    let tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("visibility", "hidden")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("border-radius", "5px");

    svg.selectAll("circle")
        .data(dataset) // 正しいデータをバインド
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.Year)) // X軸の位置をYearに基づいて設定
        .attr("cy", d => yScale(timeToSeconds(d.Time))) // Y軸の位置をTimeに基づいて設定
        .attr("r", 5)
        .attr("class", "dot")
        .attr("data-xvalue", d => d.Year) // 年 (Year) を設定
        .attr("data-yvalue", d => {
            const [minutes, seconds] = d.Time.split(':').map(Number);
            return new Date(1970, 0, 1, 0, minutes, seconds); // 分と秒をDateオブジェクトに変換
        })
        .attr("fill", d => d.Doping === "" ? "orange" : "blue") // Doping が空のときオレンジに
        .attr("id", d => d.Doping === "" ? "legend" : null) // Doping が空ならid="legend"
        .on("mouseover", (event, d) => { // 第二引数でデータにアクセス
            tooltip.transition()
                .duration(200)
                .style("visibility", "visible");
               
            tooltip.text(`Year: ${event.Year}, Time: ${event.Time}`); // データに基づいてツールチップを表示
            
            document.getElementById("tooltip").setAttribute("data-year", event.Year); // data-year を設定
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 5) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(200)
                .style("visibility", "hidden");
        });
}



req.open("GET", url, true);

req.onload = () => {
    data = JSON.parse(req.responseText);
    // datasetにDoping情報を保持するように修正
    dataset = data.map(d => ({
        Time: d.Time,
        Year: d.Year,
        Doping: d.Doping // Dopingの情報を保持
    }));
    drawCanvas();
    generateScales();
    generateAxis();
    drawScatters();

}

req.send();
