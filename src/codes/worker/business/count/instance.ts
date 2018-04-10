import { Where } from "./where";
import { ICount, IError } from "../../interfaces";
import * as Select from '../select/index';
import { LogHelper } from "../../log_helper";
import { ERROR_TYPE } from "../../enums";
import { IdbHelper } from '../idb_helper';

export class Instance extends Where {

    constructor(query: ICount, onSuccess: (noOfRecord: number) => void, onError: (error: IError) => void) {
        super();
        this.onError = onError;
        this.onSuccess = onSuccess;
        this.query = query;
    }

    execute() {
        if (this.isTableExist(this.query.from)) {
            try {
                if (this.query.where !== undefined) {
                    this.addGreatAndLessToNotOp();
                    if (this.query.where.Or || Array.isArray(this.query.where)) {
                        const selectInstance = new Select.Instance(this.query as any,
                            (results) => {
                                this.resultCount = results.length;
                                this.onTransactionCompleted();
                            }, this.onError);
                        selectInstance.execute();
                    }
                    else {
                        this.initTransaction_();
                        this.goToWhereLogic();
                    }
                }
                else {
                    this.initTransaction_();
                    this.executeWhereUndefinedLogic();
                }
            }
            catch (ex) {
                this.onExceptionOccured(ex, { TableName: this.query.from });
            }
        }
        else {
            this.errorOccured = true;
            this.onErrorOccured(
                new LogHelper(ERROR_TYPE.TableNotExist, { TableName: this.query.From }),
                true
            );
        }
    }

    private initTransaction_() {
        this.createTransaction([this.query.From], this.onTransactionCompleted, 'readonly');
        this.objectStore = this.transaction.objectStore(this.query.From);
    }
}