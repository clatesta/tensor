/**!
 *
 *  Copyright 2015 Netflix, Inc.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

/*jslint node: true*/
/*global angular*/

(function() {
    'use strict';

    /* Widgets */
    function widgetDefinitions(MetricDataModel,
                               BaselineMetricDataModel,
                               CumulativeMetricDataModel,
                               MemoryUtilizationMetricDataModel,
                               NetworkBytesMetricDataModel,
                               CpuUtilizationMetricDataModel,
                               PerCpuUtilizationMetricDataModel,
                               MultipleMetricDataModel,
                               MultipleCumulativeMetricDataModel,
                               DummyMetricDataModel,
                               DiskLatencyMetricDataModel,
                               CumulativeUtilizationMetricDataModel,
                               WRKMetricDataModel,
                               MultipleWRKMetricDataModel,
                               tensorConfig) {
        var definitions = [
            {
                name: 'kernel.all.load',
                title: 'Host Load Average',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'kernel.all.load'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.all.runnable',
                title: 'Host Runnable',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'kernel.all.runnable'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    forcey: 4,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.all.cpu.sys',
                title: 'Host CPU Utilization (System)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: CumulativeUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'kernel.all.cpu.sys'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    forcey: 1,
                    percentage: true,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.all.cpu.user',
                title: 'Host CPU Utilization (User)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: CumulativeUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'kernel.all.cpu.user'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    forcey: 1,
                    percentage: true,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.all.cpu',
                title: 'Host CPU Utilization',
                directive: 'area-stacked-time-series',
                dataAttrName: 'data',
                dataModelType: CpuUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'kernel.all.cpu'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    forcey: 1,
                    percentage: true,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.percpu.cpu.sys',
                title: 'Host Per-CPU Utilization (System)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: CumulativeUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'kernel.percpu.cpu.sys'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    forcey: 1,
                    percentage: true,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.percpu.cpu.user',
                title: 'Host Per-CPU Utilization (User)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: CumulativeUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'kernel.percpu.cpu.user'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    forcey: 1,
                    percentage: true,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.percpu.cpu',
                title: 'Host Per-CPU Utilization',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: PerCpuUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'kernel.percpu.cpu'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    forcey: 1,
                    percentage: true,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'mem.freemem',
                title: 'Host Memory Utilization (Free)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'mem.freemem'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Memory',
                attrs: {
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'mem.util.used',
                title: 'Host Memory Utilization (Used)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'mem.util.used'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Memory',
                attrs: {
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'mem.util.cached',
                title: 'Host Memory Utilization (Cached)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'mem.util.cached'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Memory',
                attrs: {
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'mem',
                title: 'Host Memory Utilization',
                directive: 'area-stacked-time-series',
                dataAttrName: 'data',
                dataModelType: MemoryUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'mem'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Memory',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.interface.out.drops',
                title: 'Host Network Drops (Out)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'network.interface.out.drops'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    forcey: 10,
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.interface.in.drops',
                title: 'Host Network Drops (In)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'network.interface.in.drops'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    forcey: 10,
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.interface.drops',
                title: 'Host Network Drops',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleMetricDataModel,
                dataModelOptions: {
                    name: 'network.interface.drops',
                    metricDefinitions: {
                        '{key} in': 'network.interface.in.drops',
                        '{key} out': 'network.interface.out.drops'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    forcey: 10,
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.tcpconn.established',
                title: 'Host TCP Connections (Estabilished)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'network.tcpconn.established'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.tcpconn.time_wait',
                title: 'Host TCP Connections (Time Wait)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'network.tcpconn.time_wait'
                },
                enableVerticalResize: false,
                size: {
                    width: '25%',
                    height: '250px'
                },
                group: 'Network',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.tcpconn.close_wait',
                title: 'Host TCP Connections (Close Wait)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MetricDataModel,
                dataModelOptions: {
                    name: 'network.tcpconn.close_wait'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.tcpconn',
                title: 'Host TCP Connections',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleMetricDataModel,
                dataModelOptions: {
                    name: 'network.tcpconn',
                    metricDefinitions: {
                        'established': 'network.tcpconn.established',
                        'time_wait': 'network.tcpconn.time_wait',
                        'close_wait': 'network.tcpconn.close_wait'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.interface.bytes',
                title: 'Host Network Throughput (MB)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: NetworkBytesMetricDataModel,
                dataModelOptions: {
                    name: 'network.interface.bytes'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    percentage: false,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'disk.iops',
                title: 'Host Disk IOPS',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleCumulativeMetricDataModel,
                dataModelOptions: {
                    name: 'disk.iops',
                    metricDefinitions: {
                        '{key} read': 'disk.dev.read',
                        '{key} write': 'disk.dev.write'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Disk',
                attrs: {
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'disk.bytes',
                title: 'Host Disk Throughput (Bytes)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleCumulativeMetricDataModel,
                dataModelOptions: {
                    name: 'disk.bytes',
                    metricDefinitions: {
                        '{key} read': 'disk.dev.read_bytes',
                        '{key} write': 'disk.dev.write_bytes'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Disk',
                attrs: {
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'disk.dev.avactive',
                title: 'Host Disk Utilization',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: CumulativeUtilizationMetricDataModel,
                dataModelOptions: {
                    name: 'disk.dev.avactive'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Disk',
                attrs: {
                    forcey: 1,
                    percentage: true,
                    integer: false,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'kernel.all.pswitch',
                title: 'Host Context Switches',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: CumulativeMetricDataModel,
                dataModelOptions: {
                    name: 'kernel.all.pswitch'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'CPU',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'mem.vmstat.pgfault',
                title: 'Host Page Faults',
                directive: 'area-stacked-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleCumulativeMetricDataModel,
                dataModelOptions: {
                    name: 'mem.vmstat.pgfault',
                    metricDefinitions: {
                        'page faults': 'mem.vmstat.pgfault',
                        'major page faults': 'mem.vmstat.pgmajfault'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Memory',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.interface.packets',
                title: 'Host Network Packets',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleCumulativeMetricDataModel,
                dataModelOptions: {
                    name: 'network.interface.packets',
                    metricDefinitions: {
                        '{key} in': 'network.interface.in.packets',
                        '{key} out': 'network.interface.out.packets'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.tcp.retrans',
                title: 'Host Network Retransmits',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleCumulativeMetricDataModel,
                dataModelOptions: {
                    name: 'network.tcp.retrans',
                    metricDefinitions: {
                        'retranssegs': 'network.tcp.retranssegs',
                        'timeouts': 'network.tcp.timeouts',
                        'listendrops': 'network.tcp.listendrops',
                        'fastretrans': 'network.tcp.fastretrans',
                        'slowstartretrans': 'network.tcp.slowstartretrans',
                        'syncretrans': 'network.tcp.syncretrans'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    forcey: 10,
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'disk.dev.latency',
                title: 'Host Disk Latency',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: DiskLatencyMetricDataModel,
                dataModelOptions: {
                    name: 'disk.dev.latency'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Disk',
                attrs: {
                    percentage: false,
                    integer: true,
                    templateurl: 'app/charts/nvd3-chart.html',
                    updatetoggle: 'updatePCPMetrics'
                }
            }, {
                name: 'network.gauge.ping',
                title: 'Baseline ping',
                directive: 'gauge',
                dataAttrName: 'data',
                dataModelType: BaselineMetricDataModel,
                dataModelOptions: {
                    name: 'network.gauge.ping'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                attrs: {
                    max: 100,
                    format: 'ms',
                    zones: [0, 15, 20, 100],
                    color: ['#88ac67', '#f78f20', '#db4e4e'],
                    type: 'ping',
                    templateurl: 'app/charts/nvd3-baseline-gauge.html',
                    updatetoggle: 'updateBaselineMetrics'
                },
                enableVerticalResize: false,
                group: 'Network'
            }, {
                name: 'network.gauge.throughput',
                title: 'Baseline throughput',
                directive: 'gauge',
                dataAttrName: 'data',
                dataModelType: BaselineMetricDataModel,
                dataModelOptions: {
                    name: 'network.gauge.throughput'
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                attrs: {
                    max: 12.5,
                    zones: [0, 10, 11, 12.5],
                    title: 'Estimated 100Mbit/s Interface',
                    type: 'throughput',
                    format: 'MB/s',
                    color: ['#db4e4e', '#f78f20', '#88ac67'],
                    templateurl: 'app/charts/nvd3-baseline-gauge.html',
                    updatetoggle: 'updateBaselineMetrics'
                },
                enableVerticalResize: false,
                group: 'Network'
            }, {
                name: 'network.wrk.throughput',
                title: 'WRK Throughput (MB)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleWRKMetricDataModel,
                dataModelOptions: {
                    name: 'network.wrk.throughput',
                    metricDefinitions: {
                        '{key} throughput': 'network.wrk.throughput.step',
                        '{key} peak throughput': 'network.wrk.throughput.max'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    maxline: true,
                    wrk: true,
                    templateurl: 'app/charts/nvd3-wrk-chart.html',
                    updatetoggle: 'updateWRKMetrics'
                }
            }, {
                name: 'network.wrk.segments',
                title: 'WRK Segments',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleWRKMetricDataModel,
                dataModelOptions: {
                    name: 'network.wrk.segments',
                    metricDefinitions: {
                        '{key} segments/s': 'network.wrk.segments.segments',
                        '{key} error/s': 'network.wrk.segments.error'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    wrk: true,
                    templateurl: 'app/charts/nvd3-wrk-chart.html',
                    updatetoggle: 'updateWRKMetrics'
                }
            }, {
                name: 'network.wrk.latency',
                title: 'WRK Segment Latency (ms)',
                directive: 'line-time-series',
                dataAttrName: 'data',
                dataModelType: MultipleWRKMetricDataModel,
                dataModelOptions: {
                    name: 'network.wrk.latency',
                    metricDefinitions: {
                        '{key} mean': 'network.wrk.latency.mean',
                        '{key} min': 'network.wrk.latency.min',
                        '{key} max': 'network.wrk.latency.max',
                        '{key} stdev': 'network.wrk.latency.stdev'
                    }
                },
                size: {
                    width: '25%',
                    height: '250px'
                },
                enableVerticalResize: false,
                group: 'Network',
                attrs: {
                    integer: true,
                    wrk: true,
                    templateurl: 'app/charts/nvd3-wrk-chart.html',
                    updatetoggle: 'updateWRKMetrics'
                }
            }
        ];

        if (tensorConfig.enableCpuFlameGraph) {
          definitions.push({
            name: 'graph.flame.cpu',
            title: 'CPU Flame Graph',
            directive: 'cpu-flame-graph',
            dataModelType: DummyMetricDataModel,
            size: {
              width: '25%',
              height: '250px'
            },
            enableVerticalResize: false,
            group: 'CPU'
          });
        }

        if (tensorConfig.enableDiskLatencyHeatMap) {
          definitions.push({
            name: 'graph.heatmap.disk',
            title: 'Disk Latency Heat Map',
            directive: 'disk-latency-heat-map',
            dataModelType: DummyMetricDataModel,
            size: {
              width: '25%',
              height: '250px'
            },
            enableVerticalResize: false,
            group: 'Disk'
          });
        }

        return definitions;
    }

    var defaultWidgets = [
        {
            name: 'kernel.all.cpu',
            size: {
                width: '25%'
            }
        }, {
            name: 'kernel.percpu.cpu',
            size: {
                width: '25%'
            }
        }, {
            name: 'kernel.all.runnable',
            size: {
                width: '25%'
            }
        }, {
            name: 'kernel.all.load',
            size: {
                width: '25%'
            }
        }, {
            name: 'network.interface.bytes',
            size: {
                width: '25%'
            }
        }, {
            name: 'network.tcpconn',
            size: {
                width: '25%'
            }
        }, {
            name: 'network.interface.packets',
            size: {
                width: '25%'
            }
        }, {
            name: 'network.tcp.retrans',
            size: {
                width: '25%'
            }
        }, {
            name: 'mem',
            size: {
                width: '50%'
            }
        }, {
            name: 'mem.vmstat.pgfault',
            size: {
                width: '25%'
            }
        }, {
            name: 'kernel.all.pswitch',
            size: {
                width: '25%'
            }
        }, {
            name: 'disk.iops',
            size: {
                width: '25%'
            }
        }, {
            name: 'disk.bytes',
            size: {
                width: '25%'
            }
        }, {
            name: 'disk.dev.avactive',
            size: {
                width: '25%'
            }
        }, {
            name: 'disk.dev.latency',
            size: {
                width: '25%'
            }
        }
    ];

    var tensorBaselineWidgets = [
        {
            name: 'network.gauge.ping',
            size: {
                height: '270px'
            }
        }, {
            name: 'network.gauge.throughput',
            size: {
                height: '270px'
            }
        }
    ];

    var tensorPCPWidgets = [{
            name: 'network.interface.bytes',
            size: {
                height: '270px'
            }
        }, {
            name: 'kernel.all.cpu',
            size: {
                height: '270px'
            }
        }, {
            name: 'disk.iops',
            size: {
                height: '270px'
            }
        }, {
            name: 'mem',
            size: {
                height: '270px'
            }
        }
    ];

    var tensorWRKWidgets = [{
            name: 'network.wrk.throughput',
            size: {
                height: '270px'
            }
        }, {
            name: 'network.wrk.segments',
            size: {
                height: '270px'
            }
        }, {
            name: 'network.wrk.latency',
            size: {
                height: '270px'
            }
        }
    ];

    var emptyWidgets = [];

    angular
        .module('app.widgets', [])
        .factory('widgetDefinitions', widgetDefinitions)
        .value('defaultWidgets', defaultWidgets)
        .value('emptyWidgets', emptyWidgets)
        .value('tensorBaselineWidgets', tensorBaselineWidgets)
        .value('tensorPCPWidgets', tensorPCPWidgets)
        .value('tensorWRKWidgets', tensorWRKWidgets);

})();
