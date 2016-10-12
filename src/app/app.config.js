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
(function() {
 'use strict';

    angular
        .module('tensor.config')
        .constant('tensorConfig', {
            port: 44323,  // PMWEBD port
            hostspec: 'localhost', // Default PMCD hostspec
            interval: 5,  // Default update interval in seconds
            window: 10,    // Default graph time window in minutes
            enableCpuFlameGraph: false,
            wrkRunning: false,
            enableDiskLatencyHeatMap: false,
            connections: {
                options: {
                    min: 1,
                    max: 1000
                },
                val: [1, 500]
            },
            connectionSteps: {
                options: {
                    floor: 1,
                    ceil: 5,
                    showTicksValues: true,
                    showTicks: false,
                    getPointerColor: function() {
                        return '#555';
                    },
                    showSelectionBar: true,
                    getSelectionBarColor: function() {
                        return '#5cb85c';
                    }
                },
                val: 5
            },
            bitRange: {
                options: {
                    hideLimitLabels: true,
                    getPointerColor: function() {
                        return '#555';
                    },
                    getSelectionBarColor: function() {
                        return '#5cb85c';
                    }
                }
            }
        });
})();
