import moment from 'moment';
import RNFetchBlob from 'rn-fetch-blob'

import { orangeColor, redColor, yellowColor, aquaGreenColor, greenColor, greyColor } from '../../Color';
import { ratio, _getTimestampFormated, _getStartDateFormated, _getEndDateFormated, isTATA } from '../../Constant';

let GraphDataDict = null

const titlefont = {
    size: 14 * ratio,
}
const tickfont = {
    size: 10 * ratio,
}
const textfont = {
    size: 6 * ratio,
}

const _getNanoAIAlarm = (threshold) => {
    return {
        xref: 'paper',
        x: 1.05,//1.05
        y: threshold,
        xanchor: 'middle',
        yanchor: 'middle',
        text: "NanoAI Alarm",
        font: { ...textfont },
        showarrow: false,
    }
}

export const _getTimeListStatus = (item) => {
    if (item.running_flag)
        return ({
            ...item,
            // colorIcon: `#00000000`,
            color: `#00000000`,
        })
    else
        return ({
            ...item,
            // colorIcon: greyColor,
            color: greyColor,
        })
}

export const timestampDisplay = (time) => moment(time).format("MMM DD,  hh:mm:ss A")
export const reportTimestampDisplay = (time) => moment(time).format("DD MMM, YYYY")

export const _getUnitLable = (state, props) => {
    if (!isTATA(props.CompanyID))
        return ''
    if (state.active_Vibration_Graph.id === 0)
        return ' - Peak to Peak'
    if (state.active_Vibration_Graph.id === 1)
        return ' - Peak'
    if (state.active_Vibration_Graph.id === 2)
        return ''
    if (state.active_Vibration_Graph.id === 3)
        return ' - Peak'
    if (state.active_Vibration_Graph.id === 4)
        return ''
    if (state.active_Vibration_Graph.id === 5)
        return ''
    return ''
}

const samplesTimeConverter = (dates) => {
    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    dates = dates.map(sample => {
        let year = moment(sample * 1000).format("YY");
        if (year >= 17)
            return timestampDisplay(sample * 1000);
    });

    return dates.sort((a, b) => a.sample - b.sample)
    //Converting sample timestamps to human readable datetime
}

const _getSmoothCurve = (mArray, mRange = 25) => {
    let k = 2 / (mRange + 1);
    // first item is just the same as the first item in the input
    let emaArray = [mArray[0]];
    // for the rest of the items, they are computed with the previous one
    for (let i = 1; i < mArray.length; i++) {
        emaArray = [...emaArray, mArray[i] * k + emaArray[i - 1] * (1 - k)];
    }
    return emaArray;
}
const _getDistributionTimeProps = (dates) => {

    let minRange, maxRange, xAxis
    let SIX_HOURS = 3 * 60 * 60

    dates = dates.map((item, index) => {
        if (index === 0)
            minRange = (item - SIX_HOURS) * 1000
        if (index === dates.length - 1)
            maxRange = (item + SIX_HOURS) * 1000

        return moment(item * 1000).format()
    })

    xAxis = {
        tickformat: '%b %d, %I:%M:%S %p',
        range: [minRange, maxRange],
        tick0: dates[0],
        nticks: 20,
    }

    return { dates, xAxis }
}

const Graph_Waveform = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {} } = GraphData
    Data = [
        ...Data,
        {
            x: Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency,
            y: Graph_plot.data[state.active_Graph_Axis.value],
            fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)
        },
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_TimeOrder.graph, true),
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Graph_Unit.graph, true)}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

const Graph_Orbit = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {} } = GraphData
    Data = [
        ...Data,
        {
            x: Graph_plot.data[Graph_plot.mountOrientation.mountMapping.horizontal],
            y: Graph_plot.data[Graph_plot.mountOrientation.mountMapping.vertical],
            // fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)
        },
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            // title: GraphData.props._LanguageTranslate(state.active_TimeOrder.graph, true),
            title: `Horizontal ${GraphData.props._LanguageTranslate(props.Graph_Unit.find(item => item.id === 2)?.graph, true)}`,
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
            range: [
                1.2 * Math.min(...Graph_plot.data[Graph_plot.mountOrientation.mountMapping.horizontal]),
                1.2 * Math.max(...Graph_plot.data[Graph_plot.mountOrientation.mountMapping.horizontal])
            ],
        },
        yaxis: {
            zeroline: false,
            // title: `${GraphData.props._LanguageTranslate(state.active_Graph_Unit.graph, true)}${_getUnitLable(state, props)}`,
            title: `Vertical ${GraphData.props._LanguageTranslate(props.Graph_Unit.find(item => item.id === 2)?.graph, true)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
            range: [
                1.2 * Math.min(...Graph_plot.data[Graph_plot.mountOrientation.mountMapping.vertical]),
                1.2 * Math.max(...Graph_plot.data[Graph_plot.mountOrientation.mountMapping.vertical])
            ],
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

const Graph_Spectrum = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {} } = GraphData
    Data = [
        ...Data,
        {
            x: Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency,
            y: Graph_plot.data[state.active_Graph_Axis.value],
            fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true),
            // hovertemplate: `${state.active_FreqTimeOrder.graph}: %{x}<br>${state.active_Graph_Unit.graph}: %{y}<extra></extra>`,
        },
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_FreqTimeOrder.graph, true),
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Graph_Unit.graph, true)}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
        // hovermode: "closest",
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

const Graph_Spectrum_Harmonic = (GraphData) => {
    // console.log({ GraphData })
    let { state, props, Graph_plot, Graph_plot_Harmonic, Data = [], Layout = {} } = GraphData

    Data = [
        ...Data,
        {
            x: Graph_plot_Harmonic[state.active_Graph_Axis.value].frequencyRange,
            y: Graph_plot.data[state.active_Graph_Axis.value],
            fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)
        },
        // Harmonic Bar
        {
            x: GraphData.Graph_plot_Harmonic[state.active_Graph_Axis.value].data.frequency,
            y: GraphData.Graph_plot_Harmonic[state.active_Graph_Axis.value].data.data[state.active_Graph_Axis.value],
            type: 'bar',
            showlegend: true,
            name: 'Harmonic',
            // width: 1 / GraphData.Graph_plot_Harmonic[state.active_Graph_Axis.value].data.frequency.length,
            width: 0.01 * (GraphData.Graph_plot_Harmonic[state.active_Graph_Axis.value].data.frequency[GraphData.Graph_plot_Harmonic[state.active_Graph_Axis.value].data.frequency.length - 1]),
            marker: {
                color: redColor
            },
        },
        // Harmonic Points
        {
            x: GraphData.Graph_plot_Harmonic[state.active_Graph_Axis.value].data.frequency,
            y: GraphData.Graph_plot_Harmonic[state.active_Graph_Axis.value].data.data[state.active_Graph_Axis.value],
            mode: 'markers',
            type: 'scatter',
            line: {
                color: 'red',
                width: 1,
                shape: 'spline',
            },
            hoverinfo: 'skip',
            // hovermode: false,
            showlegend: false,
            // name: ‘RMS’
        }
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_FreqTimeOrder.graph, true),
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Graph_Unit.graph, true)}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };

    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

const Graph_RMS = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {}, dates = [], shapes = [], annotations = [], Graph_plot_RmsEmailAlarm, Graph_plot_AiAlarm } = GraphData
    dates = Graph_plot.statsData.samples_time

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    if (state.active_Graph_Axis.value === "compare") {
        props.Graph_Axis.forEach(item => {
            Data = [
                ...Data,
                {
                    x: dates,
                    y: Graph_plot.statsData.data[item.value],
                    mode: 'lines',
                    type: 'line',
                    line: {
                        shape: 'spline',
                        // color: orangeColor,
                        width: 1,
                    },
                    showlegend: true,
                    name: `${GraphData.props._LanguageTranslate(item.text, true)}`
                }
            ];
        })
    } else if (state.active_Graph_Axis.value === "resultant") {
        let Resultant = state.active_Graph_Axis.getValue(Graph_plot.statsData.data)

        console.log(Resultant)

        Data = [
            ...Data,
            {
                x: dates,
                y: Resultant,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: aquaGreenColor,
                    size: 5,
                    shape: 'spline',
                },
                showlegend: true,
                name: `${GraphData.props._LanguageTranslate(state.active_Graph_Axis.text, true)}`
            }
        ];
        //Smoothing curve
        Data = [
            ...Data,
            {
                x: dates,
                y: _getSmoothCurve(Resultant, Resultant.length < 50 ? 4 : 25),
                mode: 'lines',
                type: 'line',
                line: {
                    shape: 'spline',
                    color: orangeColor,
                    width: 1,
                },
                showlegend: true,
                name: `Smooth ${GraphData.props._LanguageTranslate(state.active_Graph_Axis.text, true)}`
            }
        ];

    } else {
        Data = [
            ...Data,
            {
                x: dates,
                y: Graph_plot.statsData.data[state.active_Graph_Axis.value],
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: aquaGreenColor,
                    size: 5,
                    shape: 'spline',
                },
                showlegend: true,
                name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)
            }
        ];

        //Smoothing curve
        Data = [
            ...Data,
            {
                x: dates,
                y: _getSmoothCurve(Graph_plot.statsData.data[state.active_Graph_Axis.value], Graph_plot.statsData.data[state.active_Graph_Axis.value].length < 50 ? 4 : 25),
                mode: 'lines',
                type: 'line',
                line: {
                    shape: 'spline',
                    color: orangeColor,
                    width: 1,
                },
                showlegend: true,
                name: `Smooth ${GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)}`
            }
        ];

        //RMS-Velocity Warning/Alarm
        if (state?.active_Graph_Unit?.id === 1) {
            Data = [
                ...Data,
                {
                    x: [dates[dates.length - 1], dates[dates.length - 1]],
                    y: [state.active_alarmDropDown.data.warning, state.active_alarmDropDown.data.alarm],
                    mode: 'text',
                    text: ["Warning", "Alarm"],
                    showlegend: false,
                    textfont,
                },
            ]
            shapes = [
                ...shapes,
                {
                    type: 'line',
                    x0: 0,
                    y0: state.active_alarmDropDown.data.warning,
                    x1: dates[dates.length - 1],
                    y1: state.active_alarmDropDown.data.warning,
                    line: {
                        color: yellowColor,
                        width: 1,
                    }
                },
                {
                    type: 'line',
                    x0: 0,
                    y0: state.active_alarmDropDown.data.alarm,
                    x1: dates[dates.length - 1],
                    y1: state.active_alarmDropDown.data.alarm,
                    line: {
                        color: redColor,
                        width: 1,
                    }
                }
            ]
        }

        //RMS Email Alert
        if (Graph_plot_RmsEmailAlarm?.data) {
            Data = [
                ...Data,
                {
                    x: [dates[dates.length - 1]],
                    y: [parseFloat(Graph_plot_RmsEmailAlarm.data.threshold)],
                    mode: 'text',
                    text: ["Email Alarm"],
                    showlegend: false,
                    textfont,
                },
            ]
            shapes = [
                ...shapes,
                {
                    type: 'line',
                    x0: 0,
                    y0: parseFloat(Graph_plot_RmsEmailAlarm.data.threshold),
                    x1: dates[dates.length - 1],
                    y1: parseFloat(Graph_plot_RmsEmailAlarm.data.threshold),
                    line: {
                        color: orangeColor,
                        width: 1,
                    }
                },
            ]
        }
        //RMS AI Email Alert
        else if (Graph_plot_AiAlarm?.data) {
            annotations = [
                ...annotations,
                { ..._getNanoAIAlarm(parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold)) }
            ]
            shapes = [
                ...shapes,
                {
                    type: 'line',
                    x0: 0,
                    y0: parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold),
                    x1: dates[dates.length - 1],
                    y1: parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold),
                    line: {
                        color: '#C0CA33',
                        width: 1,
                    }
                },
            ]
        }
    }

    Layout = {
        xaxis: {
            // zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${state.active_Graph_Unit.id === 3 || state.active_Graph_Unit.id === 4 ?
                GraphData.props._LanguageTranslate(state.active_Graph_Unit.graph, true)
                :
                `${GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)} ${GraphData.props._LanguageTranslate(state.active_Graph_Unit.graph, true).split(' ')[1]}`}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        shapes: [...shapes],
        annotations: [...annotations],
    };
    console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

const Graph_OverallRMS = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {}, dates = [], shapes = [], annotations = [], Graph_plot_RmsEmailAlarm, Graph_plot_AiAlarm } = GraphData
    dates = Graph_plot.statsData.samples_time

    let xAxis = {}
    if (state.active_DistributionTime) {
        let minRange, maxRange
        let SIX_HOURS = 3 * 60 * 60
        dates = dates.map((item, index) => {
            if (index === 0)
                minRange = (item - SIX_HOURS) * 1000
            if (index === dates.length - 1)
                maxRange = (item + SIX_HOURS) * 1000

            return moment(item * 1000).format()
        })
        xAxis = {
            ...xAxis,
            tickformat: '%b%_d,%_I:%M:%S%_p',
            range: [minRange, maxRange],
            tick0: dates[0],
            nticks: 20,
        }
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot.statsData.data[state.active_Graph_Axis.value],
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: aquaGreenColor,
                size: 5,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true).split(' ')[1]
        }
    ];

    // Smoothing curve
    Data = [
        ...Data,
        {
            x: dates,
            y: _getSmoothCurve(Graph_plot.statsData.data[state.active_Graph_Axis.value], Graph_plot.statsData.data[state.active_Graph_Axis.value].length < 50 ? 4 : 25),
            mode: 'lines',
            type: 'line',
            line: {
                shape: 'spline',
                color: orangeColor,
                width: 1,
            },
            showlegend: true,
            name: `Smooth ${GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true).split(' ')[1]}`
        }
    ];

    // RMS-Velocity Warning/Alarm
    Data = [
        ...Data,
        {
            x: [dates[dates.length - 1], dates[dates.length - 1]],
            y: [state.active_alarmDropDown.data.warning, state.active_alarmDropDown.data.alarm],
            mode: 'text',
            text: ["Warning", "Alarm"],
            showlegend: false,
            textfont,
        },
    ]
    shapes = [
        ...shapes,
        {
            type: 'line',
            x0: 0,
            y0: state.active_alarmDropDown.data.warning,
            x1: dates[dates.length - 1],
            y1: state.active_alarmDropDown.data.warning,
            line: {
                color: yellowColor,
                width: 1,
            }
        },
        {
            type: 'line',
            x0: 0,
            y0: state.active_alarmDropDown.data.alarm,
            x1: dates[dates.length - 1],
            y1: state.active_alarmDropDown.data.alarm,
            line: {
                color: redColor,
                width: 1,
            }
        }
    ]

    // // RMS Email Alert
    // Graph_plot_RmsEmailAlarm?.data ?
    //     (
    //         Data = [
    //             ...Data,
    //             {
    //                 x: [dates[dates.length - 1]],
    //                 y: [parseFloat(Graph_plot_RmsEmailAlarm.data.threshold)],
    //                 mode: 'text',
    //                 text: ["Email Alarm"],
    //                 showlegend: false,
    //                 textfont,
    //             },
    //         ],
    //         shapes = [
    //             ...shapes,
    //             {
    //                 type: 'line',
    //                 x0: 0,
    //                 y0: parseFloat(Graph_plot_RmsEmailAlarm.data.threshold),
    //                 x1: dates[dates.length - 1],
    //                 y1: parseFloat(Graph_plot_RmsEmailAlarm.data.threshold),
    //                 line: {
    //                     color: orangeColor,
    //                     width: 1,
    //                 }
    //             },
    //         ]
    //     )
    //     :
    //     // RMS AI Email Alert
    //     Graph_plot_AiAlarm?.data && (
    //         annotations = [
    //             ...annotations,
    //             { ..._getNanoAIAlarm(parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold)) }
    //         ],
    //         shapes = [
    //             ...shapes,
    //             {
    //                 type: 'line',
    //                 x0: 0,
    //                 y0: parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold),
    //                 x1: dates[dates.length - 1],
    //                 y1: parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold),
    //                 line: {
    //                     color: '#C0CA33',
    //                     width: 1,
    //                 }
    //             },
    //         ]
    //     )
    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Vibration_Graph.unit, true)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
        shapes: [...shapes],
        annotations: [...annotations],
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

const Graph_Peak = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {}, dates = [], shapes = [], annotations = [], Graph_plot_AiAlarm } = GraphData
    dates = Graph_plot.statsData.samples_time

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    if (state.active_Graph_Axis.value === "compare") {
        props.Graph_Axis.forEach(item => {
            Data = [
                ...Data,
                {
                    x: dates,
                    y: Graph_plot.statsData.data[item.value],
                    mode: 'lines',
                    type: 'line',
                    line: {
                        shape: 'spline',
                        // color: orangeColor,
                        width: 1,
                    },
                    showlegend: true,
                    name: `${GraphData.props._LanguageTranslate(item.text, true)}`
                }
            ];
        })
    } else if (state.active_Graph_Axis.value === "resultant") {
        let Resultant = state.active_Graph_Axis.getValue(Graph_plot.statsData.data)

        console.log(Resultant)

        Data = [
            ...Data,
            {
                x: dates,
                y: Resultant,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: aquaGreenColor,
                    size: 5,
                    shape: 'spline',
                },
                showlegend: true,
                name: `${GraphData.props._LanguageTranslate(state.active_Graph_Axis.text, true)}`
            }
        ];
        //Smoothing curve
        Data = [
            ...Data,
            {
                x: dates,
                y: _getSmoothCurve(Resultant, Resultant.length < 50 ? 4 : 25),
                mode: 'lines',
                type: 'line',
                line: {
                    shape: 'spline',
                    color: orangeColor,
                    width: 1,
                },
                showlegend: true,
                name: `Smooth ${GraphData.props._LanguageTranslate(state.active_Graph_Axis.text, true)}`
            }
        ];

    } else {
        Data = [
            ...Data,
            {
                x: dates,
                y: Graph_plot.statsData.data[state.active_Graph_Axis.value],
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: aquaGreenColor,
                    size: 5,
                    shape: 'spline',
                },
                showlegend: true,
                name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)
            }
        ];

        //Smoothing curve
        Data = [
            ...Data,
            {
                x: dates,
                y: _getSmoothCurve(Graph_plot.statsData.data[state.active_Graph_Axis.value], Graph_plot.statsData.data[state.active_Graph_Axis.value].length < 50 ? 4 : 25),
                mode: 'lines',
                type: 'line',
                line: {
                    shape: 'spline',
                    color: orangeColor,
                    width: 1,
                },
                showlegend: true,
                name: `Smooth ${GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)}`
            }
        ];

        //Nano AI Email Alert
        if (Graph_plot_AiAlarm?.data) {
            annotations = [
                ...annotations,
                { ..._getNanoAIAlarm(parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold)) }
            ]
            shapes = [
                ...shapes,
                {
                    type: 'line',
                    x0: 0,
                    y0: parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold),
                    x1: dates[dates.length - 1],
                    y1: parseFloat(Graph_plot_AiAlarm.data[state.active_Graph_Axis.value].threshold),
                    line: {
                        color: '#C0CA33',
                        width: 1,
                    }
                },
            ]
        }
    }

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${state.active_Graph_Unit.id === 3 || state.active_Graph_Unit.id === 4 ?
                `${props._LanguageTranslate(state.active_Graph_Unit.graph, true)}${_getUnitLable(state, props)}`
                :
                `${props._LanguageTranslate(state.active_Vibration_Graph.value, true)} ${props._LanguageTranslate(state.active_Graph_Unit.graph, true).split(' ')[1]}`}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
        shapes: [...shapes],
        annotations: [...annotations],
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

const Graph_Kurtosis = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {}, dates = [], shapes = [] } = GraphData
    dates = Graph_plot.statsData.samples_time

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    if (state.active_Graph_Axis.value === "resultant") {
        let Resultant = state.active_Graph_Axis.getValue(Graph_plot.statsData.data)

        console.log(Resultant)

        Data = [
            ...Data,
            {
                x: dates,
                y: Resultant,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: aquaGreenColor,
                    size: 5,
                    shape: 'spline',
                },
                showlegend: true,
                name: `${GraphData.props._LanguageTranslate(state.active_Graph_Axis.text, true)}`
            }
        ];
        //Smoothing curve
        Data = [
            ...Data,
            {
                x: dates,
                y: _getSmoothCurve(Resultant, Resultant.length < 50 ? 4 : 25),
                mode: 'lines',
                type: 'line',
                line: {
                    shape: 'spline',
                    color: orangeColor,
                    width: 1,
                },
                showlegend: true,
                name: `Smooth ${GraphData.props._LanguageTranslate(state.active_Graph_Axis.text, true)}`
            }
        ];
    } else {
        Data = [
            ...Data,
            {
                x: dates,
                y: Graph_plot.statsData.data[state.active_Graph_Axis.value],
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: aquaGreenColor,
                    size: 5,
                    shape: 'spline',
                },
                showlegend: true,
                name: GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)
            }
        ];

        //Smoothing curve
        Data = [
            ...Data,
            {
                x: dates,
                y: _getSmoothCurve(Graph_plot.statsData.data[state.active_Graph_Axis.value], Graph_plot.statsData.data[state.active_Graph_Axis.value].length < 50 ? 4 : 25),
                mode: 'lines',
                type: 'line',
                line: {
                    shape: 'spline',
                    color: orangeColor,
                    width: 1,
                },
                showlegend: true,
                name: `Smooth ${GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)}`
            }
        ];
    }
    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Vibration_Graph.value, true)}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Amplitude = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {}, dates = [], shapes = [], annotations = [], y = [], text = [], Graph_plot_FaultAlarm } = GraphData

    const _isAmpUnitIn_mm_s = props._LanguageTranslate(state.active_UnitFaultList.unit) === 'Amp (mm/s)'
    const getValue = (value) => _isAmpUnitIn_mm_s ?
        state.active_Amplitude_Unit._getValue(value)
        :
        value

    let Graph_plot_data = Graph_plot.data
    let Graph_plot_ema_amp = Graph_plot.ema_amp
    if (_isAmpUnitIn_mm_s) {
        Graph_plot_data = Graph_plot_data.map(item => getValue(item))
        Graph_plot_ema_amp = Graph_plot_ema_amp.map(item => getValue(item))
    }

    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Graph_plot.thresholdData.forEach(item => {
        shapes = [
            ...shapes,
            {
                type: 'line',
                x0: 0,
                y0: getValue(item.value),
                x1: dates[dates.length - 1],
                y1: getValue(item.value),
                line: {
                    color: redColor,
                    width: 1,
                    dash: 'dot'
                }
            }
        ]
        y = [...y, getValue(item.value)]
        text = [...text, item.name]
        annotations = [
            ...annotations,
            {
                xref: 'paper',
                x: 1.05,
                y: getValue(item.value),
                xanchor: 'middle',
                yanchor: 'middle',
                text: item.name,
                font: { ...textfont },
                showarrow: false,
            }
        ]
    })
    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot_data,
            mode: 'markers',
            type: 'scatter',
            line: {
                color: aquaGreenColor,
                // width: 1,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate('AMP', false)
        }
    ];

    //Smoothing curve
    Data = [
        ...Data,
        {
            x: dates,
            // y: _getSmoothCurve(Graph_plot.data, Graph_plot.data.length < 50 ? 4 : 25),
            y: Graph_plot_ema_amp,
            mode: 'lines',
            type: 'line',
            line: {
                shape: 'spline',
                color: orangeColor,
                width: 1,
            },
            showlegend: true,
            name: `Smooth ${GraphData.props._LanguageTranslate('AMP', false)}`
        }
    ];

    // Nano AI Email Alarm
    if (Graph_plot.nanoAiAlarm) {
        annotations = [
            ...annotations,
            { ..._getNanoAIAlarm(Graph_plot.nanoAiAlarm.threshold) }
        ]
        shapes = [
            ...shapes,
            {
                type: 'line',
                x0: 0,
                y0: Graph_plot.nanoAiAlarm.threshold,
                x1: dates[dates.length - 1],
                y1: Graph_plot.nanoAiAlarm.threshold,
                line: {
                    color: '#C0CA33',
                    width: 1,
                }
            },
        ]
    }

    // Fault Stage
    // Data = [
    //     ...Data,
    //     {
    //         x: new Array(y.length).fill(dates[dates.length - 1]),
    //         y,
    //         mode: 'text',
    //         text,
    //         showlegend: false,
    //         textfont,
    //     }
    // ];

    //Fault Alert
    if (Graph_plot_FaultAlarm?.data) {
        Data = [
            ...Data,
            {
                x: [dates[dates.length - 1]],
                y: [parseFloat(Graph_plot_FaultAlarm.data.threshold)],
                mode: 'text',
                text: ["Alarm"],
                showlegend: false,
                textfont,
            },
        ]
        shapes = [
            ...shapes,
            {
                type: 'line',
                x0: 0,
                y0: parseFloat(Graph_plot_FaultAlarm.data.threshold),
                x1: dates[dates.length - 1],
                y1: parseFloat(Graph_plot_FaultAlarm.data.threshold),
                line: {
                    color: '#C0CA33',
                    width: 1,
                }
            },
        ]
    }

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Amplitude_Unit.graph)}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
        //horizontal line
        shapes: [...shapes],
        annotations: [...annotations],
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout, Data_Not_Applicable: state.active_UnitFaultList.Data_Not_Applicable }
}
const Graph_Amplitude_Sound = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {}, dates = [], shapes = [], annotations = [], y = [], text = [], Graph_plot_FaultAlarm } = GraphData

    const _isAmpUnitIn_mm_s = props._LanguageTranslate(state.active_UnitFaultList_Sound.unit) === 'Amp (mm/s)'
    const getValue = (value) => _isAmpUnitIn_mm_s ?
        state.active_Amplitude_Unit._getValue(value)
        :
        value

    let Graph_plot_data = Graph_plot.data
    let Graph_plot_ema_amp = Graph_plot.ema_amp
    if (_isAmpUnitIn_mm_s) {
        Graph_plot_data = Graph_plot_data.map(item => getValue(item))
        Graph_plot_ema_amp = Graph_plot_ema_amp.map(item => getValue(item))
    }

    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Graph_plot.thresholdData.forEach(item => {
        shapes = [
            ...shapes,
            {
                type: 'line',
                x0: 0,
                y0: getValue(item.value),
                x1: dates[dates.length - 1],
                y1: getValue(item.value),
                line: {
                    color: redColor,
                    width: 1,
                    dash: 'dot'
                }
            }
        ]
        y = [...y, getValue(item.value)]
        text = [...text, item.name]
        annotations = [
            ...annotations,
            {
                xref: 'paper',
                x: 1.05,
                y: getValue(item.value),
                xanchor: 'middle',
                yanchor: 'middle',
                text: item.name,
                font: { ...textfont },
                showarrow: false,
            }
        ]
    })
    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot_data,
            mode: 'markers',
            type: 'scatter',
            line: {
                color: aquaGreenColor,
                // width: 1,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate('AMP', false)
        }
    ];

    //Smoothing curve
    Data = [
        ...Data,
        {
            x: dates,
            // y: _getSmoothCurve(Graph_plot.data, Graph_plot.data.length < 50 ? 4 : 25),
            y: Graph_plot_ema_amp,
            mode: 'lines',
            type: 'line',
            line: {
                shape: 'spline',
                color: orangeColor,
                width: 1,
            },
            showlegend: true,
            name: `Smooth ${GraphData.props._LanguageTranslate('AMP', false)}`
        }
    ];

    // Nano AI Email Alarm
    if (Graph_plot.nanoAiAlarm) {
        annotations = [
            ...annotations,
            { ..._getNanoAIAlarm(Graph_plot.nanoAiAlarm.threshold) }
        ]
        shapes = [
            ...shapes,
            {
                type: 'line',
                x0: 0,
                y0: Graph_plot.nanoAiAlarm.threshold,
                x1: dates[dates.length - 1],
                y1: Graph_plot.nanoAiAlarm.threshold,
                line: {
                    color: '#C0CA33',
                    width: 1,
                }
            },
        ]
    }

    // Fault Stage
    // Data = [
    //     ...Data,
    //     {
    //         x: new Array(y.length).fill(dates[dates.length - 1]),
    //         y,
    //         mode: 'text',
    //         text,
    //         showlegend: false,
    //         textfont,
    //     }
    // ];

    //Fault Alert
    if (Graph_plot_FaultAlarm?.data) {
        Data = [
            ...Data,
            {
                x: [dates[dates.length - 1]],
                y: [parseFloat(Graph_plot_FaultAlarm.data.threshold)],
                mode: 'text',
                text: ["Alarm"],
                showlegend: false,
                textfont,
            },
        ]
        shapes = [
            ...shapes,
            {
                type: 'line',
                x0: 0,
                y0: parseFloat(Graph_plot_FaultAlarm.data.threshold),
                x1: dates[dates.length - 1],
                y1: parseFloat(Graph_plot_FaultAlarm.data.threshold),
                line: {
                    color: '#C0CA33',
                    width: 1,
                }
            },
        ]
    }

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Amplitude_Unit.graph)}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
        //horizontal line
        shapes: [...shapes],
        annotations: [...annotations],
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout, Data_Not_Applicable: state.active_UnitFaultList_Sound.Data_Not_Applicable }
}
const Graph_Amplitude_Compare = (GraphData) => {
    let { state, props, Graph_plot, Data = [], Layout = {}, dates = [], Graph_plot_Compare = [] } = GraphData

    const _isAmpUnitIn_mm_s = props._LanguageTranslate(state.active_UnitFaultList.unit) === 'Amp (mm/s)'
    const getValue = (value) => _isAmpUnitIn_mm_s ?
        state.active_Amplitude_Unit._getValue(value)
        :
        value

    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Graph_plot_Compare.forEach(item => {
        let Graph_plot_data = item.data.data
        if (_isAmpUnitIn_mm_s) {
            Graph_plot_data = Graph_plot_data.map(value => getValue(value))
        }

        Data = [
            ...Data,
            {
                x: dates,
                y: Graph_plot_data,
                mode: 'lines',
                type: 'line',
                line: {
                    // color: aquaGreenColor,
                    // width: 1,
                    shape: 'spline',
                },
                showlegend: true,
                name: GraphData.props._LanguageTranslate(item.details.value, false)
            }
        ];
    })


    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: `${GraphData.props._LanguageTranslate(state.active_Amplitude_Unit.graph)}${_getUnitLable(state, props)}`,
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
        legend: {
            orientation: "h",
            // x: 0,
            y: 1.2,
            font: {
                size: 8 * ratio,
            },
            bgcolor: 'rgba(255 ,255 ,255 ,0)',
        },
        //horizontal line
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout, Data_Not_Applicable: state.active_UnitFaultList.Data_Not_Applicable }
}
const Graph_Sound_TimeWave = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {} } = GraphData
    Data = [
        ...Data,
        {
            x: Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency,
            y: Graph_plot.data,
            fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Sound_Graph.value, true)
        },
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Sound_Graph.graphX, true),
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Sound_Graph.graphY, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Sound_Frequency = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {} } = GraphData
    Data = [
        ...Data,
        {
            x: Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency,
            y: Graph_plot.data,
            fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Sound_Graph.value, true)
        },
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Sound_Graph.graphX, true),
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Sound_Graph.graphY, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Sound_Rms = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {}, dates = [] } = GraphData
    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot.data,
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: aquaGreenColor,
                size: 5,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)
        }
    ];

    //Smoothing curve
    Data = [
        ...Data,
        {
            x: dates,
            y: _getSmoothCurve(Graph_plot.data, Graph_plot.data.length < 50 ? 4 : 25),
            mode: 'lines',
            type: 'line',
            line: {
                shape: 'spline',
                color: orangeColor,
                width: 1,
            },
            showlegend: true,
            name: `Smooth ${GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)}`
        }
    ];

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Sound_Graph.graphY, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Flux_TimeWave = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {} } = GraphData
    Data = [
        ...Data,
        {
            x: Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency,
            y: Graph_plot.data,
            fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Flux_Graph.value, true)
        },
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Flux_Graph.graphX, true),
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Flux_Graph.graphY, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Flux_Frequency = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {} } = GraphData
    Data = [
        ...Data,
        {
            x: Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency,
            y: Graph_plot.data,
            fill: 'tozeroy',
            type: 'lines',
            line: {
                color: aquaGreenColor,
                width: 1,
                shape: 'spline'
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_Flux_Graph.value, true)
        },
    ];
    Layout = {
        xaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Flux_Graph.graphX, true),
            color: aquaGreenColor,
            titlefont,
            tickfont,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Flux_Graph.graphY, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Flux_Rms = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {}, dates = [] } = GraphData
    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot.data,
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: aquaGreenColor,
                size: 5,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)
        }
    ];

    //Smoothing curve
    Data = [
        ...Data,
        {
            x: dates,
            y: _getSmoothCurve(Graph_plot.data, Graph_plot.data.length < 50 ? 4 : 25),
            mode: 'lines',
            type: 'line',
            line: {
                shape: 'spline',
                color: orangeColor,
                width: 1,
            },
            showlegend: true,
            name: `Smooth ${GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)}`
        }
    ];

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Flux_Graph.graphY, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Temperature = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {}, dates = [], shapes = [], Graph_plot_TempAlarm = { data: { threshold: 0 } } } = GraphData
    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot.data,
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: aquaGreenColor,
                size: 5,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)
        }
    ];

    //Smoothing curve
    Data = [
        ...Data,
        {
            x: dates,
            y: _getSmoothCurve(Graph_plot.data, Graph_plot.data.length < 50 ? 4 : 25),
            mode: 'lines',
            type: 'line',
            line: {
                shape: 'spline',
                color: orangeColor,
                width: 1,
            },
            showlegend: true,
            name: `Smooth ${GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)}`
        }
    ];

    // Temperature Alert
    if (Graph_plot_TempAlarm?.data) {
        Data = [
            ...Data,
            {
                x: [dates[dates.length - 1]],
                y: [state.active_Temperature_Unit._getValue(parseFloat(Graph_plot_TempAlarm.data.threshold))],
                mode: 'text',
                text: ["Alarm"],
                showlegend: false,
                textfont,
            },
        ]
        shapes = [
            ...shapes,
            {
                type: 'line',
                x0: 0,
                y0: state.active_Temperature_Unit._getValue(parseFloat(Graph_plot_TempAlarm.data.threshold)),
                x1: dates[dates.length - 1],
                y1: state.active_Temperature_Unit._getValue(parseFloat(Graph_plot_TempAlarm.data.threshold)),
                line: {
                    color: orangeColor,
                    width: 1,
                    dash: 'dot'
                }
            },
        ]
    }

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_Temperature_Unit.graph, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
        shapes: [...shapes]
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_Speed = (GraphData) => {
    let { state, Graph_plot, Data = [], Layout = {}, dates = [] } = GraphData
    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot.data,
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: aquaGreenColor,
                size: 5,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)
        }
    ];

    //Smoothing curve
    // Data = [
    //     ...Data,
    //     {
    //         x: dates,
    //         y: _getSmoothCurve(Graph_plot.data, Graph_plot.data.length < 50 ? 4 : 25),
    //         mode: 'lines',
    //         type: 'line',
    //         line: {
    //             shape: 'spline',
    //             color: orangeColor,
    //             width: 1,
    //         },
    //         showlegend: true,
    //         name: `Smooth ${GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)}`
    //     }
    // ];

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_TabList_Component.graph, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}
const Graph_CreateCommon = (GraphData) => {
    // Humidity-Battery-WiFi
    let { state, Graph_plot, Data = [], Layout = {}, dates = [] } = GraphData
    dates = Graph_plot.samples_time ? Graph_plot.samples_time : Graph_plot.frequency

    let xAxis = {}
    if (state.active_DistributionTime) {
        let {
            dates: _dates,
            xAxis: _xAxis
        } = _getDistributionTimeProps(dates)

        dates = _dates
        xAxis = _xAxis
    } else {
        dates = samplesTimeConverter([...dates])
    }

    Data = [
        ...Data,
        {
            x: dates,
            y: Graph_plot.data,
            mode: 'markers',
            type: 'scatter',
            marker: {
                color: aquaGreenColor,
                size: 5,
                shape: 'spline',
            },
            showlegend: true,
            name: GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)
        }
    ];

    //Smoothing curve
    Data = [
        ...Data,
        {
            x: dates,
            y: _getSmoothCurve(Graph_plot.data, Graph_plot.data.length < 50 ? 4 : 25),
            mode: 'lines',
            type: 'line',
            line: {
                shape: 'spline',
                color: orangeColor,
                width: 1,
            },
            showlegend: true,
            name: `Smooth ${GraphData.props._LanguageTranslate(state.active_TabList_Component.value, true)}`
        }
    ];

    Layout = {
        xaxis: {
            zeroline: true,
            color: aquaGreenColor,
            automargin: true,
            tickangle: "-270",
            showline: true,
            titlefont,
            tickfont,
            ...xAxis,
            // fixedrange: true,
        },
        yaxis: {
            zeroline: false,
            title: GraphData.props._LanguageTranslate(state.active_TabList_Component.graph, true),
            color: orangeColor,
            titlefont,
            tickfont,
            fixedrange: true,
        },
    };
    // console.log({ Data, Layout })
    GraphDataDict = { Data, Layout, ...GraphData }
    return { Data, Layout }
}

export const _getGraphData = (GraphData) => {
    GraphDataDict = null
    console.log('_getGraphData==>', GraphData)

    let { state, Data = [], Layout = {} } = GraphData
    if (GraphData.Graph_plot ? false : true)
        return { Data, Layout }

    try {
        if (state.active_TabList_Component.id === 1)
            switch (state.active_Vibration_Graph.id) {
                case 0: // { value: "Waveform", id: 0 },
                    return Graph_Waveform(GraphData)

                case 6: // { value: "Orbit", id: 6 },
                    return Graph_Orbit(GraphData)

                case 1: // { value: "Spectrum", id: 1 },
                    if (state.active_SpectrumHarmonicTab.id === '')
                        return Graph_Spectrum(GraphData)
                    return Graph_Spectrum_Harmonic(GraphData)

                case 4: // { value: "RMS", id: 4 },
                    return Graph_RMS(GraphData)

                case 7: // { value: "Overall RMS", id: 7 },
                    return Graph_OverallRMS(GraphData)

                case 5: // { value: "Peak", id: 5 },
                    return Graph_Peak(GraphData)

                case 2: // { value: "Kurtosis", id: 2 },
                    return Graph_Kurtosis(GraphData)

                case 3: // { value: "Amplitude", id: 3 },
                    if (state.active_Amplitud_Compare)
                        return Graph_Amplitude_Compare(GraphData)
                    return Graph_Amplitude(GraphData)

                default:
                    return { Data, Layout }
            }

        if (state.active_TabList_Component.id === 2)
            switch (state.active_Sound_Graph.id) {
                case 0:
                    return Graph_Sound_TimeWave(GraphData)
                case 1:
                    return Graph_Sound_Frequency(GraphData)
                case 2:
                    return Graph_Sound_Rms(GraphData)
                case 3: // { value: "Amplitude", id: 3 },
                    return Graph_Amplitude_Sound(GraphData)

                default:
                    return { Data, Layout }
            }

        if (state.active_TabList_Component.id === 8)
            switch (state.active_Flux_Graph.id) {
                case 0:
                    return Graph_Flux_TimeWave(GraphData)
                case 1:
                    return Graph_Flux_Frequency(GraphData)
                case 2:
                    return Graph_Flux_Rms(GraphData)

                default:
                    return { Data, Layout }
            }

        if (state.active_TabList_Component.id === 3)
            return Graph_Temperature(GraphData)

        if (state.active_TabList_Component.id === 5)
            return Graph_Speed(GraphData)

        return Graph_CreateCommon(GraphData)

    } catch (error) {
        console.log('%c' + '_getGraphData' + '==>', 'background: #e84118; color: #FFF', { error, GraphData })
        return { Data, Layout }
    }
}

export const _downloadGraphData = () => {
    try {
        // console.log('_downloadGraphData==>', GraphDataDict)
        let { Data, Layout, Graph_plot, props, state, csvData = [], filename = '' } = GraphDataDict
        let Graph_plot_data = Graph_plot?.data ?
            Graph_plot?.data
            :
            Graph_plot?.statsData?.data
        if (Graph_plot_data) {
            // File Name
            filename = `${Data[0].name}_${state.Title}_${state.active_ComponontName}`

            // Equipment Name
            csvData = [...csvData, {
                ID: csvData.length,
                Name: 'Equipment Name',
                Data: [`${state.Title}`],
            }]

            // Component Name
            csvData = [...csvData, {
                ID: csvData.length,
                Name: 'Component Name',
                Data: [`${state.active_ComponontName}`],
            }]

            // Waveform/Spectrum Domain
            if (state.active_Vibration_Graph.id === 0) {
                csvData = [...csvData, {
                    ID: csvData.length,
                    Name: 'Timestamp',
                    Data: [`${timestampDisplay(state.active_Waveforms_Time_List.timestamp * 1000)}`],
                }]

                filename += `_${moment(state.active_Waveforms_Time_List.timestamp * 1000).format('MMM DD hh.mm.ss A')}`

                csvData = [...csvData, {
                    ID: csvData.length,
                    Name: 'Domain',
                    Data: [`${state.active_TimeOrder.value}`],
                }]
            } else if (state.active_Vibration_Graph.id === 1) {
                csvData = [...csvData, {
                    ID: csvData.length,
                    Name: 'Timestamp',
                    Data: [`${timestampDisplay(state.active_Spectrum_Time_List.timestamp * 1000)}`],
                }]

                filename += `_${moment(state.active_Spectrum_Time_List.timestamp * 1000).format('MMM DD hh.mm.ss A')}`

                csvData = [...csvData, {
                    ID: csvData.length,
                    Name: 'Domain',
                    Data: [`${state.active_FreqTimeOrder.value}`],
                }]
            }

            // Y-Axis Data ( Vib-X/Y/Z/R and <arr> )
            if (Number.isInteger(Graph_plot_data?.length)) {
                // console.log('Graph_plot_data==>', Graph_plot_data)
                csvData = [...csvData, {
                    ID: csvData.length,
                    Name: `${Layout.yaxis.title}`,
                    Data: Graph_plot_data,
                }]
            } else {
                // console.log('Graph_plot_data==>', Graph_plot_data)
                props.Graph_Axis.forEach(item => {
                    csvData = [...csvData, {
                        ID: csvData.length,
                        Name: `${Data[0].name} Data(${item.text}) ${Layout.yaxis.title}`,
                        Data: Graph_plot_data[item.value],
                    }]
                })
            }

            // X-Axis Data
            csvData = [...csvData, {
                ID: csvData.length,
                Name: `${Layout.xaxis.title ? Layout.xaxis.title : 'Timestamp'}`,
                Data: Data[0].x,
            }]
        }

        // console.log({ csvData })
        let headerString = ''
        let rowString = ''
        Data[0].x.forEach((_, index) => {
            csvData.forEach(item => {
                if (index === 0) {
                    headerString = `${headerString}${item.ID === 0 ? '' : ','}${item.Name}`
                }
                let rowText = `"${item.Data[index]}"`
                rowString = `${rowString}${item.ID === 0 ? '' : ','}${item.Data[index] || item.Data[index] == 0 ? rowText : ''}`
            })
            rowString = `${rowString}\n`
        })

        const dirs = RNFetchBlob.fs.dirs;
        var path = dirs.DocumentDir + `/${filename ? filename.split(' ').join('_') : 'test'}.csv`;

        return RNFetchBlob.fs.writeFile(path, `${headerString}\n${rowString}`, 'utf8')
            .then((res) => {
                // console.log("File : ", { res, path, headerString, rowString })
                return path
            })
            .catch((err) => {
                console.log("err : ", err)
                return false
            })

    } catch (error) {
        console.log('%c' + '_downloadGraphData' + '==>', 'background: #e84118; color: #FFF', { error, GraphDataDict })
        return false
    }
}

const findGraphKey = (Data, Key) =>
    Data.find(item => {
        if (item.link_key)
            return Key.split('-').includes(item.link_key)
        return false
    })

export const _getLinkState = (graphKey, {
    TabList_Component,
    Graph_Unit,
    TimeOrder,
    FreqTimeOrder,
    Vibration_Graph,
    Sound_Graph,
    Flux_Graph,
    UnitFaultList,
    UnitFaultList_Sound,
}) => {
    let STATE = {}

    if (!graphKey)
        return STATE
    STATE = {
        ...STATE,
        active_TabList_Component: findGraphKey(TabList_Component, graphKey),
        active_Graph_Unit: findGraphKey(Graph_Unit, graphKey),
        active_TimeOrder: findGraphKey(TimeOrder, graphKey),
        active_FreqTimeOrder: findGraphKey(FreqTimeOrder, graphKey),
        active_Vibration_Graph: findGraphKey(Vibration_Graph, graphKey),
        active_Sound_Graph: findGraphKey(Sound_Graph, graphKey),
        active_Flux_Graph: findGraphKey(Flux_Graph, graphKey),
        active_UnitFaultList: findGraphKey(UnitFaultList, graphKey),
        active_UnitFaultList_Sound: findGraphKey(UnitFaultList_Sound, graphKey),
    }
    Object.keys(STATE).forEach(KEY => !STATE[KEY] && delete STATE[KEY])
    console.log({ STATE })
    return { ...STATE }
}
