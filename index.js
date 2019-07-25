const schedule = (function () {
    function extractRuleList(arr) {
        let flatArr = [
            arr,
        ]
        let tpl = null
        let temp = null
        for (let i = 0; i < arr.length; i++) {
            if (!Array.isArray(arr[i])) continue
            temp = []
            arr[i].forEach(item => {
                flatArr.forEach(item2 => {
                    tpl = item2.slice()
                    tpl[i] = item
                    temp.push(tpl)
                })
            })
            flatArr = temp
        }
        return flatArr
    }

    function isDef(val) {
        return val !== undefined
    }

    class Task {
        constructor(config, cb) {
            if (typeof config !== 'object' || typeof cb !== 'function') {
                throw 'must be valid，typeof config !== \'object\' || typeof cb !== \'function\''
            }
            // if (typeof config === 'function') {
            //     cb = config
            //     config = {}
            // }
            this.timerId = 0
            this.timerMap = {}
            this.cb = cb

            this.name = config.name || Date.now() + Math.random().toString(32).slice(-5)

            if (!Array.isArray(config.rule)) {
                /* 不执行 */
            } else {
                this.ruleList = extractRuleList(config.rule)
                this.ruleList.forEach(rule => {
                    this.exec(rule)
                })
            }
        }

        getInterval(rule) {
            const temp = {
                0: 'FullYear',
                1: 'Month',
                2: 'Date',
                3: 'Hours',
                4: 'Minutes',
                5: 'Seconds',
            }

            let targetDate = new Date()

            let MAX_UNIT_INDEX = 0
            while (!isDef(rule[MAX_UNIT_INDEX])) {
                MAX_UNIT_INDEX++
            }
            MAX_UNIT_INDEX -= 1

            let i = 0
            while (i < rule.length) {
                isDef(rule[i]) && targetDate['set' + temp[i]](rule[i])
                i++
            }

            let now = Date.now()

            // 算入下一轮
            if (targetDate < now) {
                targetDate['set' + temp[MAX_UNIT_INDEX]](targetDate['get' + temp[MAX_UNIT_INDEX]]() + 1)
            }
            console.log(targetDate.toLocaleString(), targetDate.getTime() - now)
            return targetDate.getTime() - now
        }

        exec(rule) {
            const interval = this.getInterval(rule)
            const timerId = this.timerId++
            this.timerMap[timerId] = setTimeout(() => {
                delete this.timerMap[timerId]
                // 先注册下次任务
                setTimeout(() => {
                    this.exec(rule)
                }, 1000)

                this.cb(rule)
            }, interval)
        }

        cancel() {
            for (let tid in this.timerMap) {
                clearTimeout(this.timerMap[tid])
            }
        }

    }

    return {
        job(...args) {
            return new Task(...args)
        },
    }
})()


// const task = schedule.job({
//     rule: [undefined, undefined, undefined, [1, 6, 12, 18], 0, 0],
//     /**
//      * rule
//      * 年、月、日、时、分、秒
//      * [2019,07,11,13,40,15]
//      * */
// }, function (rule) {
//     console.log(rule)
// })


// 1、6、12、18点刷新
schedule.job({
    rule: [undefined, undefined, undefined, [1, 6, 16, 18], 19, 0],
}, (rule) => {
    console.log(rule)
})


// setTimeout(function () {
//     task.cancel()
// }, 1000 * 60 * 2)


// [undefined, undefined, undefined, undefined, [15,20], [15,20]],
// [undefined, undefined, undefined, undefined, 15, 15],
// [undefined, undefined, undefined, undefined, 15, 20],
// [undefined, undefined, undefined, undefined, 20, 15],
// [undefined, undefined, undefined, undefined, 20, 20],

/**
 * 类似笛卡尔
 * [undefined, undefined, undefined, undefined, [15,20], [15,20]]
 * [undefined, undefined, undefined, undefined, 15, [15,20]]
 * [undefined, undefined, undefined, undefined, 20, [15,20]]
 * [undefined, undefined, undefined, undefined, 15, 15],
 * [undefined, undefined, undefined, undefined, 15, 20],
 * [undefined, undefined, undefined, undefined, 20, 15],
 * [undefined, undefined, undefined, undefined, 20, 20],
 * */
